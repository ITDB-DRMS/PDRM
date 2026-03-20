import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import {
  Activity,
  Bell,
  CheckCircle2,
  Mail,
  MapPin,
  MessageSquare,
  Mountain,
  Phone,
  Shield,
  Smartphone,
  Users,
  Waves,
  Wind,
} from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

import api from "@/api/axios";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { usePortalContent } from "@/hooks/usePortalContent";

type StepKey = "contact_location" | "preferences" | "household" | "delivery_review";

type AdditionalLocation = {
  label: string;
  addressLine: string;
};

type AlertSubscriptionDraft = {
  contact: { fullName: string; email: string; phone: string; altPhone: string };
  location: {
    country: string;
    region: string;
    city: string;
    addressLine: string;
    latitude: string;
    longitude: string;
    radiusKm: number;
    additionalLocations: AdditionalLocation[];
  };
  preferences: {
    categories: string[];
    severities: string[];
    minAlertLevel: string;
    language: string;
    quietHours: { enabled: boolean; start: string; end: string };
  };
  household: {
    householdSize: number;
    specialNeeds: string[];
    assetsAtRisk: string[];
    notes: string;
  };
  delivery: { channels: string[]; voiceCallEnabled: boolean; emergencyContact: string };
  consent: { accepted: boolean };
};

L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const DEFAULT_DRAFT: AlertSubscriptionDraft = {
  contact: { fullName: "", email: "", phone: "", altPhone: "" },
  location: {
    country: "",
    region: "",
    city: "",
    addressLine: "",
    latitude: "",
    longitude: "",
    radiusKm: 5,
    additionalLocations: [],
  },
  preferences: {
    categories: ["floods"],
    severities: ["warning", "emergency"],
    minAlertLevel: "warning",
    language: "en",
    quietHours: { enabled: false, start: "22:00", end: "06:00" },
  },
  household: { householdSize: 1, specialNeeds: [], assetsAtRisk: [], notes: "" },
  delivery: { channels: ["sms", "email"], voiceCallEnabled: false, emergencyContact: "" },
  consent: { accepted: false },
};

const HAZARD_GROUPS = [
  {
    id: "hydro",
    title: "Hydro-Meteorological",
    icon: Waves,
    items: ["floods", "typhoons", "storm_surges", "drought"],
  },
  {
    id: "geo",
    title: "Geological",
    icon: Mountain,
    items: ["earthquakes", "volcanic_eruptions", "landslides"],
  },
  {
    id: "env",
    title: "Environmental",
    icon: Wind,
    items: ["air_quality", "chemical_spills", "nuclear_incidents"],
  },
  {
    id: "health",
    title: "Public Health",
    icon: Activity,
    items: ["pandemics", "disease_outbreaks", "water_contamination"],
  },
];

const CATEGORY_LABELS: Record<string, string> = {
  floods: "Floods",
  typhoons: "Typhoons/Hurricanes",
  storm_surges: "Storm Surges",
  drought: "Drought",
  earthquakes: "Earthquakes",
  volcanic_eruptions: "Volcanic Eruptions",
  landslides: "Landslides",
  air_quality: "Air Quality Index (AQI)",
  chemical_spills: "Chemical Spills",
  nuclear_incidents: "Nuclear Incidents",
  pandemics: "Pandemics",
  disease_outbreaks: "Disease Outbreaks",
  water_contamination: "Water Contamination",
};

const SPECIAL_NEEDS = [
  { key: "limited_mobility", label: "Resident with limited mobility" },
  { key: "hearing", label: "Resident who is deaf/hard of hearing" },
  { key: "vision", label: "Resident who is blind/visually impaired" },
  { key: "medical_power", label: "Resident requiring medical electricity (e.g., respirator)" },
];

const ASSETS_AT_RISK = [
  { key: "boat", label: "I own a boat (need flood relocation)" },
  { key: "livestock", label: "I have livestock" },
  { key: "multi_story", label: "I live in a multi-story building (need vertical evacuation)" },
];

const ALERT_LEVELS = [
  {
    key: "advisory",
    label: "Advisory (Yellow)",
    description: "Stay informed - potential risk developing",
  },
  {
    key: "alert",
    label: "Alert (Orange)",
    description: "Be prepared - conditions are favorable for disaster",
  },
  {
    key: "warning",
    label: "Warning (Red)",
    description: "Take immediate action - life-threatening emergency",
  },
];

const CHANNEL_OPTIONS = [
  { key: "sms", label: "SMS", description: "Fastest, best for cell areas", icon: Phone },
  { key: "voice", label: "Voice Call", description: "Robocall for elderly", icon: Phone },
  { key: "push", label: "Mobile Push", description: "Via mobile app", icon: Smartphone },
  { key: "email", label: "Email", description: "Detailed instructions", icon: Mail },
  { key: "whatsapp", label: "WhatsApp/Telegram", description: "Social messaging", icon: MessageSquare },
];

const isEmailLike = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

const StepBubble: React.FC<{
  active: boolean;
  done: boolean;
  label: string;
  icon: React.ReactNode;
}> = ({ active, done, label, icon }) => (
  <div className="flex flex-col items-center gap-3">
    <div
      className={[
        "h-12 w-12 rounded-full flex items-center justify-center border-2",
        done
          ? "bg-emerald-600 text-white border-emerald-600"
          : active
          ? "bg-red-600 text-white border-red-600"
          : "bg-white text-slate-400 border-slate-200",
      ].join(" ")}
      aria-hidden="true"
    >
      {icon}
    </div>
    <div className={active ? "text-red-600 font-semibold" : "text-slate-500"}>
      {label}
    </div>
  </div>
);

const AlertSubscriptionPage: React.FC = () => {
  const { portalContent } = usePortalContent();
  const [step, setStep] = useState<StepKey>("contact_location");
  const [draft, setDraft] = useState<AlertSubscriptionDraft>(DEFAULT_DRAFT);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const sectionsVisibility = portalContent?.sectionsVisibility;
  const showHeader = sectionsVisibility?.header !== false;
  const showFooter = sectionsVisibility?.footer !== false;
  const showContact = sectionsVisibility?.contact !== false;

  const steps = useMemo(
    () =>
      [
        {
          key: "contact_location" as const,
          label: "Contact & Location",
          icon: <MapPin className="h-5 w-5" />,
        },
        {
          key: "preferences" as const,
          label: "Alert Preferences",
          icon: <Shield className="h-5 w-5" />,
        },
        {
          key: "household" as const,
          label: "Household Info",
          icon: <Users className="h-5 w-5" />,
        },
        {
          key: "delivery_review" as const,
          label: "Delivery & Review",
          icon: <Bell className="h-5 w-5" />,
        },
      ] as const,
    []
  );

  const stepIndex = steps.findIndex((s) => s.key === step);

  const canGoNext = () => {
    if (step === "contact_location") {
      if (!draft.contact.phone.trim()) return false;
      if (!draft.contact.email.trim() || !isEmailLike(draft.contact.email)) return false;
      if (!draft.preferences.language) return false;
      return Boolean(draft.location.addressLine.trim());
    }
    if (step === "preferences") {
      return draft.preferences.categories.length > 0 && draft.preferences.minAlertLevel.length > 0;
    }
    if (step === "household") {
      return draft.household.householdSize >= 1;
    }
    if (step === "delivery_review") {
      return draft.delivery.channels.length > 0 && draft.consent.accepted;
    }
    return false;
  };

  const goNext = () => {
    if (!canGoNext()) {
      toast.error("Please complete the required fields to continue.");
      return;
    }
    setStep(steps[Math.min(stepIndex + 1, steps.length - 1)].key);
  };

  const goBack = () => setStep(steps[Math.max(stepIndex - 1, 0)].key);

  const onSubmit = async () => {
    if (!canGoNext()) {
      toast.error("Please review and accept consent to submit.");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        contact: {
          fullName: draft.contact.fullName,
          email: draft.contact.email || "",
          phone: draft.contact.phone || "",
          altPhone: draft.contact.altPhone || "",
        },
        location: {
          country: draft.location.country,
          region: draft.location.region,
          city: draft.location.city,
          addressLine: draft.location.addressLine,
          latitude: draft.location.latitude ? Number(draft.location.latitude) : null,
          longitude: draft.location.longitude ? Number(draft.location.longitude) : null,
          radiusKm: draft.location.radiusKm,
          additionalLocations: draft.location.additionalLocations,
        },
        preferences: draft.preferences,
        household: draft.household,
        delivery: {
          channels: draft.delivery.channels,
          emailEnabled: draft.delivery.channels.includes("email"),
          smsEnabled: draft.delivery.channels.includes("sms"),
          whatsappEnabled: draft.delivery.channels.includes("whatsapp"),
          inAppEnabled: draft.delivery.channels.includes("push"),
          voiceCallEnabled: draft.delivery.voiceCallEnabled || draft.delivery.channels.includes("voice"),
          emergencyContact: draft.delivery.emergencyContact,
        },
        consent: { accepted: draft.consent.accepted },
      };

      await api.post("/alert-subscriptions", payload);
      toast.success("Successfully subscribed. You will receive a test alert shortly.");
      setShowSuccess(true);
      setDraft(DEFAULT_DRAFT);
      setStep("contact_location");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to save subscription.");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleCategory = (key: string) => {
    setDraft((prev) => {
      const selected = prev.preferences.categories.includes(key);
      const categories = selected
        ? prev.preferences.categories.filter((c) => c !== key)
        : [...prev.preferences.categories, key];
      return { ...prev, preferences: { ...prev.preferences, categories } };
    });
  };

  const toggleNeed = (key: string) => {
    setDraft((prev) => {
      const selected = prev.household.specialNeeds.includes(key);
      const specialNeeds = selected
        ? prev.household.specialNeeds.filter((c) => c !== key)
        : [...prev.household.specialNeeds, key];
      return { ...prev, household: { ...prev.household, specialNeeds } };
    });
  };

  const toggleAsset = (key: string) => {
    setDraft((prev) => {
      const selected = prev.household.assetsAtRisk.includes(key);
      const assetsAtRisk = selected
        ? prev.household.assetsAtRisk.filter((c) => c !== key)
        : [...prev.household.assetsAtRisk, key];
      return { ...prev, household: { ...prev.household, assetsAtRisk } };
    });
  };

  const toggleChannel = (key: string) => {
    setDraft((prev) => {
      const selected = prev.delivery.channels.includes(key);
      const channels = selected
        ? prev.delivery.channels.filter((c) => c !== key)
        : [...prev.delivery.channels, key];
      return {
        ...prev,
        delivery: {
          ...prev.delivery,
          channels,
          voiceCallEnabled: key === "voice" ? !selected : prev.delivery.voiceCallEnabled,
        },
      };
    });
  };

  const updateAdditionalLocation = (index: number, field: keyof AdditionalLocation, value: string) => {
    setDraft((prev) => {
      const additionalLocations = [...prev.location.additionalLocations];
      additionalLocations[index] = { ...additionalLocations[index], [field]: value };
      return { ...prev, location: { ...prev.location, additionalLocations } };
    });
  };

  const addLocation = () => {
    setDraft((prev) => ({
      ...prev,
      location: {
        ...prev.location,
        additionalLocations: [...prev.location.additionalLocations, { label: "Additional Location", addressLine: "" }],
      },
    }));
  };

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    const map = L.map(mapContainerRef.current, { scrollWheelZoom: false }).setView([9.03, 38.74], 10);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    map.on("click", (event) => {
      setDraft((prev) => ({
        ...prev,
        location: {
          ...prev.location,
          latitude: event.latlng.lat.toFixed(6),
          longitude: event.latlng.lng.toFixed(6),
        },
      }));
    });

    mapRef.current = map;
    return () => {
      map.remove();
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    if (!draft.location.latitude || !draft.location.longitude) return;
    const lat = Number(draft.location.latitude);
    const lng = Number(draft.location.longitude);
    if (!markerRef.current) {
      markerRef.current = L.marker([lat, lng]).addTo(mapRef.current);
    } else {
      markerRef.current.setLatLng([lat, lng]);
    }
    mapRef.current.setView([lat, lng], mapRef.current.getZoom());
  }, [draft.location.latitude, draft.location.longitude]);

  return (
    <div className="min-h-screen bg-white font-outfit transition-colors duration-300">
      {showHeader ? <Header branding={portalContent?.branding} header={portalContent?.header} /> : null}
      <main className="bg-[#fff6f6] pt-28 pb-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center">
            <div className="inline-flex items-center justify-center gap-3">
              <Shield className="h-10 w-10 text-red-600" />
              <h1 className="text-4xl font-semibold tracking-tight text-slate-900">Disaster Ready</h1>
            </div>
            <div className="mt-2 text-lg text-slate-700">Alert Subscription & Management</div>
            <div className="mt-2 text-slate-500">
              "Just-in-Time, Just-for-Me" - Receive targeted, life-saving information without alert fatigue
            </div>
          </div>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-4 gap-6 items-center">
            {steps.map((s, idx) => (
              <div key={s.key} className="flex flex-col items-center">
                <StepBubble active={step === s.key} done={idx < stepIndex} label={s.label} icon={s.icon} />
                {idx < steps.length - 1 ? <div className="hidden sm:block h-[2px] w-full bg-slate-200 mt-4" /> : null}
              </div>
            ))}
          </div>

          <div className="mt-10 bg-white rounded-[28px] border border-slate-100 shadow-xl p-6 sm:p-10">
            {step === "contact_location" ? (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Contact Information</h2>
                  <p className="text-slate-500">Where should we send your alerts?</p>
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <label className="text-sm text-slate-600">
                      Primary Mobile Number <span className="text-red-500">*</span>
                      <div className="mt-2 flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2">
                        <Phone className="h-4 w-4 text-slate-400" />
                        <input
                          className="w-full outline-none text-slate-700"
                          value={draft.contact.phone}
                          onChange={(e) => setDraft((p) => ({ ...p, contact: { ...p.contact, phone: e.target.value } }))}
                          placeholder="+1 (555) 123-4567"
                          inputMode="tel"
                        />
                      </div>
                    </label>
                    <label className="text-sm text-slate-600">
                      Alternative / Home Phone <span className="text-slate-400">(Optional)</span>
                      <div className="mt-2 flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2">
                        <Phone className="h-4 w-4 text-slate-400" />
                        <input
                          className="w-full outline-none text-slate-700"
                          value={draft.contact.altPhone}
                          onChange={(e) => setDraft((p) => ({ ...p, contact: { ...p.contact, altPhone: e.target.value } }))}
                          placeholder="+1 (555) 987-6543"
                          inputMode="tel"
                        />
                      </div>
                    </label>
                    <label className="text-sm text-slate-600 md:col-span-2">
                      Email Address <span className="text-red-500">*</span>
                      <div className="mt-2 flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2">
                        <Mail className="h-4 w-4 text-slate-400" />
                        <input
                          className="w-full outline-none text-slate-700"
                          value={draft.contact.email}
                          onChange={(e) => setDraft((p) => ({ ...p, contact: { ...p.contact, email: e.target.value } }))}
                          placeholder="your.email@example.com"
                          inputMode="email"
                        />
                      </div>
                      <div className="mt-2 text-xs text-slate-400">
                        For detailed PDF reports and safety checklists
                      </div>
                    </label>
                    <label className="text-sm text-slate-600">
                      Preferred Language <span className="text-red-500">*</span>
                      <select
                        className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none text-slate-700"
                        value={draft.preferences.language}
                        onChange={(e) =>
                          setDraft((p) => ({ ...p, preferences: { ...p.preferences, language: e.target.value } }))
                        }
                      >
                        <option value="en">English</option>
                        <option value="am">Amharic</option>
                        <option value="om">Afaan Oromo</option>
                        <option value="ti">Tigrinya</option>
                      </select>
                    </label>
                    <label className="flex items-center gap-3 text-sm text-slate-600 mt-6">
                      <input
                        type="checkbox"
                        checked={draft.delivery.voiceCallEnabled}
                        onChange={(e) =>
                          setDraft((p) => ({ ...p, delivery: { ...p.delivery, voiceCallEnabled: e.target.checked } }))
                        }
                      />
                      I require voice calls for text alerts (Accessibility)
                    </label>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-8">
                  <h2 className="text-2xl font-bold text-slate-900">Location Management</h2>
                  <p className="text-slate-500">
                    Pin your exact location for hyper-local alerts. Disasters are location-specific.
                  </p>

                  <div className="mt-6 rounded-2xl border border-slate-200 p-6">
                    <div className="flex items-center gap-3 text-slate-800 font-semibold">
                      <MapPin className="h-5 w-5 text-red-600" />
                      Primary Residence
                    </div>
                    <label className="text-sm text-slate-600 block mt-4">
                      Address
                      <input
                        className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none text-slate-700"
                        value={draft.location.addressLine}
                        onChange={(e) =>
                          setDraft((p) => ({ ...p, location: { ...p.location, addressLine: e.target.value } }))
                        }
                        placeholder="123 Main Street, City, State ZIP"
                      />
                    </label>
                    <div className="mt-4 rounded-2xl border border-dashed border-slate-300 overflow-hidden">
                      <div ref={mapContainerRef} className="h-56 w-full" />
                      <div className="px-4 py-3 text-center text-sm text-slate-500 bg-gradient-to-r from-blue-50 to-emerald-50">
                        Click to drop pin on map
                        <div className="text-xs text-slate-400">Auto-complete with GPS coordinates</div>
                      </div>
                    </div>
                    <div className="mt-4 text-sm text-slate-600">
                      Alert Radius: <span className="text-red-600 font-semibold">{draft.location.radiusKm}km</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={50}
                      value={draft.location.radiusKm}
                      onChange={(e) =>
                        setDraft((p) => ({
                          ...p,
                          location: { ...p.location, radiusKm: Number(e.target.value) },
                        }))
                      }
                      className="w-full mt-2 accent-red-600"
                    />
                    <div className="flex justify-between text-xs text-slate-400 mt-1">
                      <span>1km</span>
                      <span>50km</span>
                    </div>
                  </div>

                  {draft.location.additionalLocations.length > 0 ? (
                    <div className="mt-6 space-y-4">
                      {draft.location.additionalLocations.map((loc, idx) => (
                        <div key={idx} className="rounded-2xl border border-slate-200 p-4">
                          <label className="text-sm text-slate-600 block">
                            Location Label
                            <input
                              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none text-slate-700"
                              value={loc.label}
                              onChange={(e) => updateAdditionalLocation(idx, "label", e.target.value)}
                            />
                          </label>
                          <label className="text-sm text-slate-600 block mt-3">
                            Address
                            <input
                              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none text-slate-700"
                              value={loc.addressLine}
                              onChange={(e) => updateAdditionalLocation(idx, "addressLine", e.target.value)}
                              placeholder="Workplace, School, etc."
                            />
                          </label>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  <button
                    type="button"
                    onClick={addLocation}
                    className="mt-6 w-full rounded-2xl border border-dashed border-slate-300 py-3 text-slate-600 hover:border-slate-400"
                  >
                    + Add Another Location (e.g., Workplace, School)
                  </button>
                </div>
              </div>
            ) : null}

            {step === "preferences" ? (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Step 2 of 4: What dangers concern you?</h2>
                  <p className="text-slate-500">Choose disaster types to avoid alert fatigue</p>
                </div>

                <div className="rounded-2xl border border-blue-200 bg-blue-50/40 p-5 flex items-start gap-4">
                  <input
                    type="checkbox"
                    checked={draft.preferences.categories.length === Object.keys(CATEGORY_LABELS).length}
                    onChange={(e) =>
                      setDraft((p) => ({
                        ...p,
                        preferences: {
                          ...p.preferences,
                          categories: e.target.checked ? Object.keys(CATEGORY_LABELS) : [],
                        },
                      }))
                    }
                    className="mt-1"
                  />
                  <div>
                    <div className="font-semibold text-slate-900">All Hazards</div>
                    <div className="text-sm text-slate-500">Subscribe to every possible alert type</div>
                  </div>
                </div>

                <div className="space-y-6">
                  {HAZARD_GROUPS.map((group) => {
                    const Icon = group.icon;
                    return (
                      <div key={group.id}>
                        <div className="flex items-center gap-3 text-slate-800 font-semibold mb-3">
                          <Icon className="h-5 w-5 text-blue-600" />
                          {group.title}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {group.items.map((item) => (
                            <label
                              key={item}
                              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3"
                            >
                              <input
                                type="checkbox"
                                checked={draft.preferences.categories.includes(item)}
                                onChange={() => toggleCategory(item)}
                              />
                              <span className="text-slate-800">{CATEGORY_LABELS[item]}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <h3 className="text-xl font-bold text-slate-900">How urgent? (Minimum Alert Level)</h3>
                  <div className="mt-4 space-y-4">
                    {ALERT_LEVELS.map((level) => (
                      <label
                        key={level.key}
                        className={`flex items-start gap-3 rounded-2xl border px-4 py-4 ${draft.preferences.minAlertLevel === level.key
                          ? "border-red-500 bg-red-50/50"
                          : "border-slate-200 bg-white"
                          }`}
                      >
                        <input
                          type="radio"
                          name="minAlertLevel"
                          checked={draft.preferences.minAlertLevel === level.key}
                          onChange={() =>
                            setDraft((p) => ({ ...p, preferences: { ...p.preferences, minAlertLevel: level.key } }))
                          }
                          className="mt-1"
                        />
                        <div>
                          <div className="font-semibold text-slate-900">{level.label}</div>
                          <div className="text-sm text-slate-500">{level.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            {step === "household" ? (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Household Profile</h2>
                  <p className="text-slate-500">Help emergency services prioritize response and tailor instructions</p>
                </div>

                <label className="text-sm text-slate-600 block">
                  How many people typically live in your household?
                  <input
                    type="number"
                    min={1}
                    className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none text-slate-700"
                    value={draft.household.householdSize}
                    onChange={(e) =>
                      setDraft((p) => ({ ...p, household: { ...p.household, householdSize: Number(e.target.value || 1) } }))
                    }
                  />
                </label>

                <div>
                  <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    Special Needs / Accessibility
                  </h3>
                  <p className="text-slate-500 text-sm">
                    If a power outage is coming, residents with special needs require different alerts
                  </p>
                  <div className="mt-4 space-y-3">
                    {SPECIAL_NEEDS.map((item) => (
                      <label key={item.key} className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                        <input type="checkbox" checked={draft.household.specialNeeds.includes(item.key)} onChange={() => toggleNeed(item.key)} />
                        <span className="text-slate-800">{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Shield className="h-5 w-5 text-blue-600" /> Assets at Risk
                  </h3>
                  <div className="mt-4 space-y-3">
                    {ASSETS_AT_RISK.map((item) => (
                      <label key={item.key} className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                        <input type="checkbox" checked={draft.household.assetsAtRisk.includes(item.key)} onChange={() => toggleAsset(item.key)} />
                        <span className="text-slate-800">{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <label className="text-sm text-slate-600 block">
                  Notes (optional)
                  <textarea
                    className="mt-2 w-full min-h-[120px] rounded-xl border border-slate-200 px-3 py-2 outline-none text-slate-700"
                    value={draft.household.notes}
                    onChange={(e) => setDraft((p) => ({ ...p, household: { ...p.household, notes: e.target.value } }))}
                  />
                </label>
              </div>
            ) : null}

            {step === "delivery_review" ? (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Delivery Preferences</h2>
                  <p className="text-slate-500">How and when should we contact you?</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {CHANNEL_OPTIONS.map((channel) => {
                    const Icon = channel.icon;
                    const selected = draft.delivery.channels.includes(channel.key);
                    return (
                      <button
                        key={channel.key}
                        type="button"
                        onClick={() => toggleChannel(channel.key)}
                        className={`text-left rounded-2xl border p-4 transition ${selected ? "border-red-500 bg-red-50/50" : "border-slate-200 bg-white"}`}
                      >
                        <div className="flex items-start gap-3">
                          <input type="checkbox" checked={selected} readOnly className="mt-1" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 font-semibold text-slate-900">
                              <Icon className="h-4 w-4 text-slate-500" />
                              {channel.label}
                            </div>
                            <div className="text-sm text-slate-500">{channel.description}</div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <label className="flex items-center gap-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={draft.preferences.quietHours.enabled}
                    onChange={(e) =>
                      setDraft((p) => ({ ...p, preferences: { ...p.preferences, quietHours: { ...p.preferences.quietHours, enabled: e.target.checked } } }))
                    }
                  />
                  Enable Quiet Hours
                </label>

                <label className="text-sm text-slate-600 block">
                  Emergency Contact / Family Coordinator (Optional)
                  <div className="mt-2 flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2">
                    <Phone className="h-4 w-4 text-slate-400" />
                    <input
                      className="w-full outline-none text-slate-700"
                      value={draft.delivery.emergencyContact}
                      onChange={(e) => setDraft((p) => ({ ...p, delivery: { ...p.delivery, emergencyContact: e.target.value } }))}
                      placeholder="Family member's phone number"
                      inputMode="tel"
                    />
                  </div>
                  <div className="mt-2 text-xs text-slate-400">
                    An adult child or family member in another city who can coordinate
                  </div>
                </label>

                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5">
                  <div className="flex items-center gap-2 font-semibold text-emerald-700">
                    <CheckCircle2 className="h-5 w-5" /> Subscription Summary
                  </div>
                  <div className="mt-3 text-sm text-emerald-800 space-y-1">
                    <div>We will receive alerts at {draft.location.additionalLocations.length + 1} location(s)</div>
                    <div>Monitoring {draft.preferences.categories.length} disaster type(s)</div>
                    <div>Via {draft.delivery.channels.length} notification channel(s)</div>
                    <div>Preferred language: {draft.preferences.language}</div>
                  </div>
                </div>

                <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-5 text-sm text-slate-700">
                  <div className="font-semibold mb-1">What happens next?</div>
                  After subscribing, you will receive a test alert to confirm everything is working.
                  You can update your preferences anytime using the magic link we will send to your email.
                </div>

                <label className="mt-4 flex items-start gap-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={draft.consent.accepted}
                    onChange={(e) => setDraft((p) => ({ ...p, consent: { accepted: e.target.checked } }))}
                    className="mt-1"
                  />
                  I agree to receive safety alerts via my selected channels. I can unsubscribe at any time.
                </label>
              </div>
            ) : null}

            <div className="mt-10 flex items-center justify-between gap-3 border-t border-slate-100 pt-6">
              <button
                type="button"
                onClick={goBack}
                disabled={stepIndex === 0}
                className={[
                  "px-6 py-3 rounded-xl border transition text-sm font-semibold",
                  stepIndex === 0
                    ? "opacity-50 cursor-not-allowed border-slate-200 text-slate-400"
                    : "border-slate-200 text-slate-700 hover:border-slate-300",
                ].join(" ")}
              >
                Previous
              </button>

              {step !== "delivery_review" ? (
                <button
                  type="button"
                  onClick={goNext}
                  className="px-8 py-3 rounded-xl bg-red-600 text-white hover:bg-red-700 transition text-sm font-semibold"
                >
                  Next Step
                </button>
              ) : (
                <button
                  type="button"
                  disabled={submitting}
                  onClick={onSubmit}
                  className={[
                    "px-8 py-3 rounded-xl text-white transition text-sm font-semibold",
                    submitting ? "bg-slate-400 cursor-not-allowed" : "bg-red-600 hover:bg-red-700",
                  ].join(" ")}
                >
                  {submitting ? "Saving..." : "Save subscription"}
                </button>
              )}
            </div>
          </div>
        </div>
      </main>

      {showSuccess ? (
        <div className="fixed inset-0 z-[9999] bg-black/30 flex items-center justify-center px-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 font-semibold text-slate-800">
              Subscription Confirmed
            </div>
            <div className="px-5 py-5 text-slate-600">
              Successfully subscribed. You will receive a test alert shortly.
            </div>
            <div className="px-5 py-4 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setShowSuccess(false)}
                className="px-5 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showFooter ? (
        <Footer branding={portalContent?.branding} contact={portalContent?.contact} footer={portalContent?.footer} showContact={showContact} />
      ) : null}
    </div>
  );
};

export default AlertSubscriptionPage;
