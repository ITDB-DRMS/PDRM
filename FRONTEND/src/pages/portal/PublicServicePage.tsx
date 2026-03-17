import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { ArrowLeft, Sparkles, HelpCircle, CheckCircle2 } from "lucide-react";

import api from "@/api/axios";
import PageMeta from "@/components/common/PageMeta";
import FormRenderer from "@/components/TemplateEngine/FormRenderer/FormRenderer";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { usePortalContent } from "@/hooks/usePortalContent";

type PortalService = {
  title: string;
  description: string;
  slug: string;
  templateSearch?: string;
  moduleContextType?: string;
};

const PublicServicePage: React.FC = () => {
  const navigate = useNavigate();
  const { serviceSlug } = useParams();

  const { portalContent, loading: portalLoading } = usePortalContent();
  const sectionsVisibility = portalContent?.sectionsVisibility;
  const showHeader = sectionsVisibility?.header !== false;
  const showFooter = sectionsVisibility?.footer !== false;
  const showContact = sectionsVisibility?.contact !== false;
  const showServices = sectionsVisibility?.services !== false;

  const serviceConfig = useMemo<PortalService | null>(() => {
    if (!serviceSlug) return null;
    const services: PortalService[] =
      portalContent?.servicesSection?.services || portalContent?.services || [];
    return services.find((s) => s.slug === serviceSlug) || null;
  }, [portalContent, serviceSlug]);

  const [template, setTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const loadTemplate = async () => {
      try {
        setLoading(true);
        setSubmitted(false);
        setTemplate(null);

        if (!serviceSlug) return;
        if (serviceSlug === "alert-subscription") {
          navigate("/alert-subscription", { replace: true });
          return;
        }
        if (!portalContent && portalLoading) return;
        if (!serviceConfig) return;

        const response = await api.get(
          `/templates?status=Published&search=${encodeURIComponent(
            serviceConfig.templateSearch || serviceConfig.title
          )}`
        );

        if (response.data && response.data.length > 0) {
          setTemplate(response.data[0]);
        } else {
          setTemplate(null);
        }
      } catch (error) {
        console.error("Error loading portal template:", error);
        setTemplate(null);
      } finally {
        setLoading(false);
      }
    };

    loadTemplate();
  }, [serviceSlug, portalContent, portalLoading, serviceConfig]);

  const onSubmit = async (data: any) => {
    if (!serviceConfig || !template) return;
    try {
      const payload = {
        templateId: template._id,
        templateVersion: template.version,
        moduleContextId: template._id,
        moduleContextType: serviceConfig.moduleContextType || "PortalService",
        answers: data,
        respondentMetadata: {
          fullName: "Portal User",
          submittedAt: new Date().toISOString(),
          source: "Public Portal",
          service: serviceConfig.title,
        },
      };

      await api.post("/responses", payload);
      toast.success("Submitted successfully.");
      setSubmitted(true);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to submit");
    }
  };

  if (!showServices && !loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFF] font-outfit">
        <PageMeta title="Service | IDRMIS Portal" description="Public portal service" />
        {showHeader ? <Header branding={portalContent?.branding} header={portalContent?.header} /> : null}
        <main className="pt-28 px-6 pb-24">
          <div className="max-w-3xl mx-auto bg-white border border-slate-100 rounded-[40px] p-10 shadow-sm text-center">
            <div className="w-20 h-20 bg-rose-50 rounded-[28px] flex items-center justify-center mx-auto mb-6 text-rose-500">
              <HelpCircle size={44} />
            </div>
            <h1 className="text-3xl font-black text-slate-900 mb-3">Services are turned off</h1>
            <p className="text-slate-500 font-medium mb-8">
              This section is currently hidden in site settings.
            </p>
            <button
              onClick={() => navigate("/portal")}
              className="px-10 py-4 bg-slate-950 text-white rounded-2xl font-black hover:bg-indigo-600 transition-all"
            >
              Back to portal
            </button>
          </div>
        </main>
        {showFooter ? (
          <Footer branding={portalContent?.branding} contact={portalContent?.contact} footer={portalContent?.footer} showContact={showContact} />
        ) : null}
      </div>
    );
  }

  if (!serviceConfig && !loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFF] font-outfit">
        <PageMeta title="Service | IDRMIS Portal" description="Public portal service" />
        {showHeader ? <Header branding={portalContent?.branding} header={portalContent?.header} /> : null}
        <main className="pt-28 px-6 pb-24">
          <div className="max-w-3xl mx-auto bg-white border border-slate-100 rounded-[40px] p-10 shadow-sm text-center">
            <div className="w-20 h-20 bg-rose-50 rounded-[28px] flex items-center justify-center mx-auto mb-6 text-rose-500">
              <HelpCircle size={44} />
            </div>
            <h1 className="text-3xl font-black text-slate-900 mb-3">Service not found</h1>
            <p className="text-slate-500 font-medium mb-8">
              The requested service does not exist on the public portal.
            </p>
            <button
              onClick={() => navigate("/portal")}
              className="px-10 py-4 bg-slate-950 text-white rounded-2xl font-black hover:bg-indigo-600 transition-all"
            >
              Back to portal
            </button>
          </div>
        </main>
        {showFooter ? (
          <Footer branding={portalContent?.branding} contact={portalContent?.contact} footer={portalContent?.footer} showContact={showContact} />
        ) : null}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
          <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-600 w-6 h-6 animate-pulse" />
        </div>
        <p className="mt-6 text-slate-400 font-bold uppercase tracking-widest text-xs">
          Loading portal service...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFF] font-outfit overflow-x-hidden">
      <PageMeta
        title={`${serviceConfig?.title || "Service"} | IDRMIS Portal`}
        description={serviceConfig?.description || "Public portal service"}
      />
      {showHeader ? <Header branding={portalContent?.branding} header={portalContent?.header} /> : null}

      <div className="pt-28 pb-10">
        <div className="container mx-auto px-6">
          <button
            onClick={() => navigate("/portal#services")}
            className="inline-flex items-center gap-2 text-slate-600 hover:text-indigo-600 font-bold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to services
          </button>
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 text-4xl md:text-5xl font-black tracking-tight text-slate-950"
          >
            {serviceConfig?.title}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 text-lg text-slate-500 font-medium max-w-3xl"
          >
            {serviceConfig?.description}
          </motion.p>
        </div>
      </div>

      <main className="pb-24 px-6">
        <div className="max-w-4xl mx-auto">
          {!template ? (
            <div className="bg-white rounded-[48px] p-12 md:p-16 text-center shadow-[0_40px_100px_-30px_rgba(15,23,42,0.15)] border border-slate-100">
              <div className="w-24 h-24 bg-rose-50 rounded-[32px] flex items-center justify-center mx-auto mb-8 text-rose-500">
                <HelpCircle size={48} />
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4 tracking-tight">
                Service temporarily unavailable
              </h2>
              <p className="text-slate-500 mb-10 text-lg font-medium leading-relaxed max-w-2xl mx-auto">
                No published template is configured for this service yet. Please try again later.
              </p>
              <button
                onClick={() => navigate("/portal#services")}
                className="px-12 py-4 bg-slate-950 text-white rounded-2xl font-black hover:bg-indigo-600 transition-all"
              >
                Return to services
              </button>
            </div>
          ) : submitted ? (
            <div className="bg-white rounded-[56px] p-14 md:p-20 text-center shadow-[0_60px_120px_-30px_rgba(0,0,0,0.1)] border border-emerald-50 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-indigo-500 via-teal-400 to-emerald-400" />
              <div className="w-28 h-28 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-8 text-emerald-500">
                <CheckCircle2 size={64} />
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-slate-950 mb-4 tracking-tight">
                Submitted successfully
              </h2>
              <p className="text-slate-500 mb-10 text-xl font-medium leading-relaxed max-w-xl mx-auto">
                Your submission has been received.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => navigate("/portal#services")}
                  className="px-12 py-4 bg-slate-950 text-white rounded-2xl font-black hover:bg-indigo-600 transition-all"
                >
                  Back to services
                </button>
                <button
                  onClick={() => setSubmitted(false)}
                  className="px-12 py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all"
                >
                  Submit another
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-[40px] p-6 md:p-10 shadow-[0_40px_100px_-30px_rgba(15,23,42,0.15)] border border-slate-100">
              <FormRenderer
                template={template}
                onSubmit={onSubmit}
              />
            </div>
          )}
        </div>
      </main>
      {showFooter ? (
        <Footer branding={portalContent?.branding} contact={portalContent?.contact} footer={portalContent?.footer} showContact={showContact} />
      ) : null}
    </div>
  );
};

export default PublicServicePage;
