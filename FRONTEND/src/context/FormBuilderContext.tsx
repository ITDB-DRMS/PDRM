import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';

// --- Types & Interfaces ---
export type AnswerType =
    | 'header' | 'note' | 'text' | 'textarea' | 'number' | 'date'
    | 'radio' | 'checkbox' | 'select' | 'matrix' | 'table'
    | 'geo' | 'phone' | 'email' | 'file';

export interface Option {
    label: string;
    value: string;
    hasAdditionalInput?: boolean;
    additionalInput?: {
        type: 'text' | 'textarea' | 'number';
        label: string;
    };
}

export interface Question {
    questionId: string;
    questionCode: string;
    label: string;
    answerType: AnswerType;
    helperText: string;
    required: boolean;
    options: Option[];
    matrixConfig: {
        rows: { label: string; value: string }[];
        columns: { label: string; value: string }[];
        cellType: 'radio' | 'checkbox' | 'number' | 'text';
    };
    tableConfig: {
        columns: { label: string; type: string }[];
        allowAddRow: boolean;
    };
    validation: {
        min?: string | number;
        max?: string | number;
        pattern?: string;
        placeholder?: string;
    };
}

export interface Module {
    moduleId: string;
    moduleName: string;
    questions: Question[];
}

export interface FormTemplate {
    templateName: string;
    modules: Module[];
}

interface FormState {
    template: FormTemplate;
    activeQuestionId: string | null;
    isSelectingType: boolean;
    targetModuleId: string | null;
}

// --- Actions ---
type Action =
    | { type: 'SET_TEMPLATE_NAME'; name: string }
    | { type: 'ADD_MODULE'; name: string }
    | { type: 'REMOVE_MODULE'; moduleId: string }
    | { type: 'UPDATE_MODULE_NAME'; moduleId: string; name: string }
    | { type: 'OPEN_TYPE_SELECTOR'; moduleId: string }
    | { type: 'CLOSE_TYPE_SELECTOR' }
    | { type: 'ADD_QUESTION'; moduleId: string; answerType: AnswerType }
    | { type: 'UPDATE_QUESTION'; questionId: string; updates: Partial<Question> }
    | { type: 'REMOVE_QUESTION'; questionId: string }
    | { type: 'SELECT_QUESTION'; questionId: string | null }
    | { type: 'LOAD_TEMPLATE'; template: FormTemplate };

// --- Reducer ---
const formReducer = (state: FormState, action: Action): FormState => {
    switch (action.type) {
        case 'SET_TEMPLATE_NAME':
            return { ...state, template: { ...state.template, templateName: action.name } };

        case 'ADD_MODULE':
            return {
                ...state,
                template: {
                    ...state.template,
                    modules: [...state.template.modules, { moduleId: uuidv4(), moduleName: action.name, questions: [] }]
                }
            };

        case 'UPDATE_MODULE_NAME':
            return {
                ...state,
                template: {
                    ...state.template,
                    modules: state.template.modules.map(m => m.moduleId === action.moduleId ? { ...m, moduleName: action.name } : m)
                }
            };

        case 'OPEN_TYPE_SELECTOR':
            return { ...state, isSelectingType: true, targetModuleId: action.moduleId };

        case 'CLOSE_TYPE_SELECTOR':
            return { ...state, isSelectingType: false, targetModuleId: null };

        case 'ADD_QUESTION': {
            const newQuestion: Question = {
                questionId: uuidv4(),
                questionCode: `q${Math.floor(Math.random() * 900) + 100}`,
                label: action.answerType === 'header' ? 'New Header' : action.answerType === 'note' ? 'New Note' : 'New Question',
                answerType: action.answerType,
                helperText: '',
                required: false,
                options: [],
                matrixConfig: { rows: [], columns: [], cellType: 'radio' },
                tableConfig: { columns: [], allowAddRow: true },
                validation: {}
            };

            return {
                ...state,
                isSelectingType: false,
                targetModuleId: null,
                activeQuestionId: newQuestion.questionId,
                template: {
                    ...state.template,
                    modules: state.template.modules.map(m =>
                        m.moduleId === action.moduleId
                            ? { ...m, questions: [...m.questions, newQuestion] }
                            : m
                    )
                }
            };
        }

        case 'UPDATE_QUESTION':
            return {
                ...state,
                template: {
                    ...state.template,
                    modules: state.template.modules.map(m => ({
                        ...m,
                        questions: m.questions.map(q => q.questionId === action.questionId ? { ...q, ...action.updates } : q)
                    }))
                }
            };

        case 'REMOVE_QUESTION':
            return {
                ...state,
                activeQuestionId: state.activeQuestionId === action.questionId ? null : state.activeQuestionId,
                template: {
                    ...state.template,
                    modules: state.template.modules.map(m => ({
                        ...m,
                        questions: m.questions.filter(q => q.questionId !== action.questionId)
                    }))
                }
            };

        case 'SELECT_QUESTION':
            return { ...state, activeQuestionId: action.questionId };

        case 'LOAD_TEMPLATE':
            return { ...state, template: action.template, activeQuestionId: null };

        default:
            return state;
    }
};

const initialState: FormState = {
    template: {
        templateName: "New Questionnaire",
        modules: [
            { moduleId: uuidv4(), moduleName: "Module 1", questions: [] }
        ]
    },
    activeQuestionId: null,
    isSelectingType: false,
    targetModuleId: null
};

const FormBuilderContext = createContext<{
    state: FormState;
    dispatch: React.Dispatch<Action>;
} | undefined>(undefined);

export const FormBuilderProvider = ({ children }: { children: ReactNode }) => {
    const [state, dispatch] = useReducer(formReducer, initialState);
    return (
        <FormBuilderContext.Provider value={{ state, dispatch }}>
            {children}
        </FormBuilderContext.Provider>
    );
};

export const useFormBuilder = () => {
    const context = useContext(FormBuilderContext);
    if (!context) throw new Error('useFormBuilder must be used within a FormBuilderProvider');
    return context;
};
