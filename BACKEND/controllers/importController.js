import Template from '../models/Template.js';
import mammoth from 'mammoth';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

export const importWordTemplate = async (req, res) => {
    try {
        console.log('Import attempt - File:', req.file ? req.file.originalname : 'MISSING');
        console.log('Category/ModuleType:', req.body.category, req.body.moduleType);

        if (req.file) {
            console.log('File metadata:', {
                originalname: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size,
                hasBuffer: !!req.file.buffer
            });
        }

        if (!req.file || !req.file.buffer) {
            return res.status(400).json({ message: 'No file uploaded or file buffer is empty' });
        }

        const { category, moduleType } = req.body;

        // Convert docx to HTML to preserve structural elements like tables and list items
        console.log('Extracting HTML with mammoth for structural analysis...');
        const { value: html } = await mammoth.convertToHtml({ buffer: req.file.buffer });

        // Modules/Sections/Fields hierarchy
        const modules = [];
        let currentModule = null;
        let currentSection = null;
        let currentField = null;

        const addModule = (title) => {
            currentModule = {
                moduleId: `mod_${uuidv4().substring(0, 8)}`,
                title: title || 'New Module',
                order: modules.length + 1,
                sections: []
            };
            modules.push(currentModule);
            currentSection = { sectionId: uuidv4(), title: 'General', fields: [] };
            currentModule.sections.push(currentSection);
            currentField = null;
        };

        // Split HTML into blocks (paragraphs, tables, headings)
        const blocks = html.split(/<(?=h[1-6]|p|table)/i);

        blocks.forEach((block) => {
            const raw = block.trim();
            if (!raw) return;

            // Normalize block to close its own tags for parsing
            const content = `<${raw}`.replace(/<<+/, '<');
            const textContent = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
            if (!textContent) return;

            // 1. Detect Modules/Chapters (H1 or BOLD CAPITALS)
            const isHeading = content.match(/<h[1-2][^>]*>(.*?)<\/h[1-2]>/i) ||
                (content.match(/<strong>(.*?)<\/strong>/i) && textContent.length < 100 && textContent === textContent.toUpperCase());

            if (isHeading) {
                addModule(textContent);
                return;
            }

            // 2. Detect Sections (H3 or Ends with Colon)
            const isSection = content.match(/<h[3-4][^>]*>(.*?)<\/h[3-4]>/i) ||
                (textContent.length < 80 && textContent.endsWith(':') && !textContent.match(/^q\d+/i));

            if (isSection && currentModule) {
                currentSection = {
                    sectionId: uuidv4(),
                    title: textContent.replace(/:$/, '').trim(),
                    fields: []
                };
                currentModule.sections.push(currentSection);
                currentField = null;
                return;
            }

            // 3. Detect Table (Matrix Question)
            if (content.match(/<table/i)) {
                // Extract rows and columns
                const rows = [];
                const trRegex = /<tr[^>]*>(.*?)<\/tr>/gi;
                let trMatch;

                while ((trMatch = trRegex.exec(content)) !== null) {
                    const rowHtml = trMatch[1];
                    const cells = [];
                    const tdRegex = /<t[dh][^>]*>(.*?)<\/t[dh]>/gi;
                    let tdMatch;
                    while ((tdMatch = tdRegex.exec(rowHtml)) !== null) {
                        cells.push(tdMatch[1].replace(/<[^>]+>/g, '').trim());
                    }
                    if (cells.length > 0) rows.push(cells);
                }

                if (rows.length > 1) {
                    const header = rows[0];
                    const dataRows = rows.slice(1);

                    if (!currentSection) addModule('Survey Section');

                    const matrixField = {
                        fieldId: uuidv4(),
                        questionCode: `qmtx_${uuidv4().substring(0, 4)}`,
                        label: (currentField && (currentField.type === 'note' || currentField.type === 'text')) ? currentField.label : 'Information Matrix',
                        type: 'matrix',
                        matrixConfig: {
                            columns: header.slice(1).map(c => ({ label: c, value: c })),
                            rows: dataRows.map(r => ({ label: r[0], value: r[0] })),
                            cellType: 'radio'
                        },
                        required: false,
                        options: [],
                        helpText: 'Select the most appropriate option for each row.',
                        permissions: { visibleToRoles: [], editableByRoles: [] }
                    };
                    currentSection.fields.push(matrixField);
                    currentField = matrixField;
                    return;
                }
            }

            // 4. Detect Question (q101 style)
            const questionMatch = textContent.match(/^\s*(q[0-9]{1,4}[a-z]?[0-9]*)[\.\s\t:]+(.*)/i);
            if (questionMatch) {
                const qCode = questionMatch[1].toLowerCase();
                const qLabel = questionMatch[2].trim();

                if (!currentSection) addModule('Questionnaire');

                currentField = {
                    fieldId: uuidv4(),
                    questionCode: qCode,
                    label: qLabel,
                    type: (qLabel.toLowerCase().includes('age') || qLabel.toLowerCase().includes('how many')) ? 'number' : 'text',
                    required: false,
                    options: [],
                    helpText: '',
                    permissions: { visibleToRoles: [], editableByRoles: [] }
                };
                currentSection.fields.push(currentField);

                // Detect embedded instructions (italicized in HTML)
                const instructionMatch = content.match(/<em[^>]*>(.*?)<\/em>|<i[^>]*>(.*?)<\/i>/i);
                if (instructionMatch) {
                    currentField.helpText = (instructionMatch[1] || instructionMatch[2]).replace(/<[^>]+>/g, '').trim();
                }
                return;
            }

            // 5. Detect Options (Bullets or starting with 'o', '-', '*')
            const isBullet = content.match(/<li>|<\s*p[^>]*>\s*[o○\u25CB\u25EF\u25E6\-*+]/i);
            if (isBullet && currentField) {
                const optText = textContent.replace(/^[o○\u25CB\u25EF\u25E6\-*+\s\t]+/, '').trim();
                if (optText) {
                    if (currentField.type === 'text' || currentField.type === 'note') {
                        currentField.type = 'radio';
                    }
                    currentField.options.push({ label: optText, value: String(currentField.options.length + 1) });
                    return;
                }
            }

            // 6. Greedy Text Catch-all
            if (currentField && textContent.length > 2) {
                const isInstruction = textContent.match(/^(Enumerator|Note|Instruction|Skip|If|Read|Please|Select|Only)/i) || content.match(/<em|<i/i);
                const isConditional = textContent.match(/^(If|Skip|When|Go to)/i);

                if (isInstruction) {
                    currentField.helpText = currentField.helpText ? `${currentField.helpText} ${textContent}` : textContent;
                    if (isConditional) {
                        currentField.conditionalLogic = {
                            ...currentField.conditionalLogic,
                            statement: textContent
                        };
                    }
                } else if (!textContent.match(/^q\d+/i) && textContent.length < 300) {
                    // If it's not a question and not a bullet, it's likely a continuation of the previous field's label or help text
                    if (currentField.type === 'note' || currentField.type === 'text') {
                        currentField.label += ' ' + textContent;
                    } else {
                        currentField.helpText = currentField.helpText ? `${currentField.helpText} ${textContent}` : textContent;
                    }
                }
            } else if (currentSection && textContent.length > 5 && !textContent.match(/^q\d+/i)) {
                currentField = {
                    fieldId: uuidv4(),
                    questionCode: `note_${uuidv4().substring(0, 4)}`,
                    label: textContent,
                    type: 'note',
                    required: false,
                    options: [],
                    helpText: '',
                    permissions: { visibleToRoles: [], editableByRoles: [] }
                };
                currentSection.fields.push(currentField);
            }
        });

        console.log('Parsing complete. Modules found:', modules.length);

        res.json({
            name: req.file.originalname.replace('.docx', ''),
            category: category || 'Household',
            moduleType: moduleType || 'HHQ',
            modules
        });

    } catch (error) {
        console.error('Import error:', error);
        fs.appendFileSync('import_errors.log', `${new Date().toISOString()} - ${error.message}\n${error.stack}\n`);
        res.status(500).json({
            message: 'Error parsing Word document',
            details: error.message
        });
    }
};
