"use client";

import styles from "@/styles/admin/Design/page.module.css";
import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@src/lib/supabase/client";
import { AdminHeader as Header } from "@src/components/layout";
import { AdminSidebar as Sidebar } from "@src/components/layout";
import {
    Download,
    Loader2,
    Search,
    RotateCcw,
    ImageDown,
    FileType2,
    Folder,
    FileText,
    ArrowLeft,
    ChevronRight,
    ChevronDown,
    LayoutGrid,
    Users,
    ShieldCheck,
    Calculator,
    Wallet,
    CalendarDays,
    Phone,
    X
} from "lucide-react";

interface Advisor {
    id: string;
    advisor_name: string;
}

interface Client {
    id: string;
    client_name: string;
    policy_number: string | null;
    advisor_id: string | null;
    beneficiary: string | null;
    annual_premium: string | null;
    mobile_number: string | null;
    email: string | null;
    address: string | null;
}

interface RiderBenefit {
    id: string;
    code: string;
    fullName: string;
    amount: number;
    type: "lumpsum" | "daily";
    selected: boolean;
}

interface PolicyCardData {
    policyInsured: string;
    policyNumber: string;
    policyCoverage: string;
    additionalBenefits: string;
    paymentYears: string;
    annualPremium: string;
    quarterlyPremium: string;
    monthlyPremium: string;
    effectiveDate: string;
    maturityDate: string;
    mobileNumber: string;
    email: string;
    address: string;
}

interface FieldPosition {
    left: number;
    top: number;
    width: number;
    fontSize: number;
    fontWeight: number;
    color: string;
    align: "left" | "center" | "right";
}

interface TemplateDef {
    id: string;
    name: string;
    src: string;
    width: number;
    height: number;
    fieldPositions: Partial<Record<keyof PolicyCardData, FieldPosition>>;
}

const TEMPLATE_CATEGORIES = ["Cards", "Posters", "Certificates", "Social Media", "Custom Designs"] as const;
type TemplateCategory = typeof TEMPLATE_CATEGORIES[number];
type LibraryView = "browse" | "files" | "editor";

const SUN_MAXILINK_PRIME_POSITIONS: Record<string, FieldPosition> = {
    policyInsured: { left: 396, top: 152, width: 576, fontSize: 24, fontWeight: 700, color: "#173B4D", align: "left" },
    policyNumber: { left: 396, top: 205, width: 576, fontSize: 24, fontWeight: 700, color: "#173B4D", align: "left" },
    policyCoverage: { left: 396, top: 258, width: 576, fontSize: 24, fontWeight: 700, color: "#173B4D", align: "left" },
    additionalBenefits: { left: 396, top: 311, width: 576, fontSize: 24, fontWeight: 700, color: "#173B4D", align: "left" },
    paymentYears: { left: 396, top: 364, width: 576, fontSize: 24, fontWeight: 700, color: "#173B4D", align: "left" },
    annualPremium: { left: 396, top: 418, width: 147, fontSize: 24, fontWeight: 700, color: "#173B4D", align: "center" },
    quarterlyPremium: { left: 597, top: 418, width: 147, fontSize: 24, fontWeight: 700, color: "#173B4D", align: "center" },
    monthlyPremium: { left: 773, top: 418, width: 157, fontSize: 24, fontWeight: 700, color: "#173B4D", align: "center" },
    effectiveDate: { left: 313, top: 546, width: 172, fontSize: 20, fontWeight: 700, color: "#173B4D", align: "center" },
    maturityDate: { left: 519, top: 546, width: 172, fontSize: 20, fontWeight: 700, color: "#173B4D", align: "center" }
};

const TEMPLATE_LIBRARY: Record<TemplateCategory, TemplateDef[]> = {
    "Cards": [
        {
            id: "sun_maxilink_prime",
            name: "Sun Maxilink Prime",
            src: "/Image/Card/CPC.png",
            width: 1011,
            height: 639,
            fieldPositions: SUN_MAXILINK_PRIME_POSITIONS
        }
    ],
    "Posters": [
        { id: "event_poster", name: "Event Posters", src: "/Image/Card/CPC.png", width: 800, height: 1200, fieldPositions: {} },
        { id: "recruitment_poster", name: "Recruitment Posters", src: "/Image/Card/CPC.png", width: 800, height: 1200, fieldPositions: {} },
        { id: "marketing_poster", name: "Marketing Posters", src: "/Image/Card/CPC.png", width: 800, height: 1200, fieldPositions: {} }
    ],
    "Certificates": [],
    "Social Media": [],
    "Custom Designs": []
};

const FONT_FAMILY = '"Helvetica Now", "Helvetica Neue", Helvetica, Arial, sans-serif';

const EMPTY_CARD_DATA: PolicyCardData = {
    policyInsured: "",
    policyNumber: "",
    policyCoverage: "",
    additionalBenefits: "",
    paymentYears: "",
    annualPremium: "",
    quarterlyPremium: "",
    monthlyPremium: "",
    effectiveDate: "",
    maturityDate: "",
    mobileNumber: "",
    email: "",
    address: ""
};

const SUNLIFE_RIDERS: RiderBenefit[] = [
    { id: "adb", code: "ADB", fullName: "Accidental Death Benefit", amount: 0, type: "lumpsum", selected: false },
    { id: "addd", code: "ADDD", fullName: "Accidental Death, Dismemberment & Disablement Benefit", amount: 0, type: "lumpsum", selected: false },
    { id: "tdb", code: "TDB", fullName: "Total Disability Benefit", amount: 0, type: "lumpsum", selected: false },
    { id: "cbtd", code: "CBTD", fullName: "Contingent Benefit upon Total Disability", amount: 0, type: "lumpsum", selected: false },
    { id: "wpd", code: "WPD", fullName: "Waiver of Premium upon Death of Initial Owner", amount: 0, type: "lumpsum", selected: false },
    { id: "wdd", code: "WDD", fullName: "Waiver of Premium upon Death or Disability of Initial Owner", amount: 0, type: "lumpsum", selected: false },
    { id: "cib", code: "CIB", fullName: "Critical Illness Benefit", amount: 0, type: "lumpsum", selected: false },
    { id: "fci", code: "FCI", fullName: "Female Critical Illness Benefit", amount: 0, type: "lumpsum", selected: false },
    { id: "fcm", code: "FCM", fullName: "Female Critical Illness & Maternity Benefit", amount: 0, type: "lumpsum", selected: false },
    { id: "hib", code: "HIB", fullName: "Hospital Income Benefit", amount: 0, type: "daily", selected: false },
    { id: "lbr", code: "LBR", fullName: "Living Benefit Rider (Terminal Illness Benefit)", amount: 0, type: "lumpsum", selected: false }
];

function getClientCardName(fullName: string | undefined | null): string {
    if (!fullName) return "";
    const trimmed = fullName.trim();
    if (trimmed.includes(",")) return trimmed;
    const words = trimmed.split(/\s+/);
    if (words.length === 1) return words[0];
    const last = words[words.length - 1];
    const rest = words.slice(0, words.length - 1).join(" ");
    return `${last}, ${rest}`;
}

function formatPeso(value: string) {
    if (!value) return "";
    const cleaned = value.replace(/[₱,]/g, "");
    if (isNaN(Number(cleaned))) return value;
    return `₱${Number(cleaned).toLocaleString("en-PH")}`;
}

function formatRiderAmount(amount: number, type: "lumpsum" | "daily"): string {
    if (!amount) return type === "daily" ? "₱0/day" : "₱0";
    if (type === "daily") {
        return `₱${amount.toLocaleString("en-PH")}/day`;
    }
    return `₱${amount.toLocaleString("en-PH")}`;
}

function formatDateDisplay(value: string): string {
    if (!value) return "";
    const date = new Date(`${value}T00:00:00`);
    if (isNaN(date.getTime())) return value;
    return date.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}

function fitFontSizePx(
    ctx: CanvasRenderingContext2D,
    text: string,
    fontWeight: number,
    maxWidthPx: number,
    maxFontSizePx: number,
    minFontSizePx: number
): number {
    let size = maxFontSizePx;
    while (size > minFontSizePx) {
        ctx.font = `${fontWeight} ${size}px ${FONT_FAMILY}`;
        if (ctx.measureText(text).width <= maxWidthPx) return size;
        size -= 1;
    }
    return minFontSizePx;
}

export default function DesignPage() {
    const [libraryView, setLibraryView] = useState<LibraryView>("browse");
    const [selectedCategory, setSelectedCategory] = useState<TemplateCategory>("Cards");
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>("sun_maxilink_prime");
    const [advisors, setAdvisors] = useState<Advisor[]>([]);
    const [advisorsLoading, setAdvisorsLoading] = useState<boolean>(true);
    const [selectedAdvisorId, setSelectedAdvisorId] = useState<string>("");
    const [clients, setClients] = useState<Client[]>([]);
    const [clientsLoading, setClientsLoading] = useState<boolean>(false);
    const [selectedClientId, setSelectedClientId] = useState<string>("");
    const [clientSearch, setClientSearch] = useState<string>("");
    const [cardData, setCardData] = useState<PolicyCardData>(EMPTY_CARD_DATA);
    const [zoom, setZoom] = useState<number>(70);
    const [exporting, setExporting] = useState<boolean>(false);
    const [thumbErrors, setThumbErrors] = useState<Record<string, boolean>>({});
    const [riders, setRiders] = useState<RiderBenefit[]>(SUNLIFE_RIDERS.map((r) => ({ ...r })));
    const [benefitsOpen, setBenefitsOpen] = useState<boolean>(false);
    const [paymentMode, setPaymentMode] = useState<"Annual" | "Quarterly" | "Monthly">("Annual");
    const [policyTerm, setPolicyTerm] = useState<string>("");
    const [cardSize, setCardSize] = useState<"small" | "medium" | "large">("medium");

    const measureCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const benefitsRef = useRef<HTMLDivElement | null>(null);

    const getMeasureCtx = () => {
        if (!measureCanvasRef.current) {
            measureCanvasRef.current = document.createElement("canvas");
        }
        return measureCanvasRef.current.getContext("2d");
    };

    useEffect(() => {
        loadAdvisors();
    }, []);

    useEffect(() => {
        if (!selectedAdvisorId) {
            setClients([]);
            setSelectedClientId("");
            return;
        }
        loadClients(selectedAdvisorId);
        setSelectedClientId("");
    }, [selectedAdvisorId]);

    useEffect(() => {
        if (!selectedClientId) return;
        const client = clients.find((c) => c.id === selectedClientId);
        if (!client) return;
        setCardData((prev) => ({
            ...prev,
            policyInsured: getClientCardName(client.client_name),
            policyNumber: client.policy_number || "",
            additionalBenefits: client.beneficiary || "",
            annualPremium: formatPeso(client.annual_premium || ""),
            mobileNumber: client.mobile_number || "",
            email: client.email || "",
            address: client.address || ""
        }));
    }, [selectedClientId, clients]);

    useEffect(() => {
        const templates = TEMPLATE_LIBRARY[selectedCategory];
        if (templates.length > 0) {
            setSelectedTemplateId(templates[0].id);
        } else {
            setSelectedTemplateId("");
        }
    }, [selectedCategory]);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (benefitsRef.current && !benefitsRef.current.contains(e.target as Node)) {
                setBenefitsOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const loadAdvisors = async () => {
        setAdvisorsLoading(true);
        try {
            const { data, error } = await supabase
                .from("advisors")
                .select("id, advisor_name")
                .order("advisor_name", { ascending: true });
            if (error) throw error;
            setAdvisors(data || []);
        } catch {
            setAdvisors([]);
        } finally {
            setAdvisorsLoading(false);
        }
    };

    const loadClients = async (advisorId: string) => {
        setClientsLoading(true);
        try {
            const { data, error } = await supabase
                .from("cpst_clients")
                .select("id, client_name, policy_number, advisor_id, beneficiary, annual_premium, mobile_number, email, address")
                .eq("advisor_id", advisorId)
                .order("client_name", { ascending: true });

            if (error) {
                const fallback = await supabase
                    .from("cpst_clients")
                    .select("id, client_name, policy_number, advisor_id")
                    .eq("advisor_id", advisorId)
                    .order("client_name", { ascending: true });
                if (fallback.error) throw fallback.error;
                const mappedFallback = (fallback.data || []).map(c => ({
                    ...c,
                    beneficiary: null,
                    annual_premium: null,
                    mobile_number: null,
                    email: null,
                    address: null
                }));
                setClients(mappedFallback);
            } else {
                setClients(data || []);
            }
        } catch {
            setClients([]);
        } finally {
            setClientsLoading(false);
        }
    };

    const handleFieldChange = (field: keyof PolicyCardData, value: string) => {
        let finalValue = value;
        if (["policyCoverage", "annualPremium", "quarterlyPremium", "monthlyPremium"].includes(field)) {
            finalValue = formatPeso(value);
        }
        setCardData((prev) => {
            const next = { ...prev, [field]: finalValue };

            if (field === "annualPremium") {
                const cleaned = value.replace(/[₱,]/g, "");
                const annualNum = Number(cleaned);
                if (!isNaN(annualNum) && annualNum > 0) {
                    next.quarterlyPremium = formatPeso((annualNum / 4).toString());
                    next.monthlyPremium = formatPeso((annualNum / 12).toString());
                } else if (cleaned === "") {
                    next.quarterlyPremium = "";
                    next.monthlyPremium = "";
                }
            }

            return next;
        });
    };

    const toggleRider = (id: string, checked: boolean) => {
        setRiders((prev) => prev.map((r) => (r.id === id ? { ...r, selected: checked } : r)));
    };

    const updateRiderAmount = (id: string, value: string) => {
        const cleaned = value.replace(/[^0-9]/g, "");
        const num = parseInt(cleaned, 10) || 0;
        setRiders((prev) => prev.map((r) => (r.id === id ? { ...r, amount: num } : r)));
    };

    useEffect(() => {
        const selected = riders.filter(r => r.selected);
        if (selected.length === 0) {
            setCardData(prev => ({ ...prev, additionalBenefits: "" }));
            return;
        }
        const str = selected
            .map(r => `${r.code} (${formatRiderAmount(r.amount, r.type)})`)
            .join(" + ");
        setCardData(prev => ({ ...prev, additionalBenefits: str }));
    }, [riders]);

    useEffect(() => {
        if (!policyTerm) {
            setCardData(prev => ({ ...prev, paymentYears: "" }));
            return;
        }
        const term = parseInt(policyTerm, 10);
        if (isNaN(term)) return;

        let result = "";
        if (paymentMode === "Annual") {
            result = `${term} Years`;
        } else if (paymentMode === "Quarterly") {
            result = `${term * 4} Payments`;
        } else if (paymentMode === "Monthly") {
            result = `${term * 12} Payments`;
        }
        setCardData(prev => ({ ...prev, paymentYears: result }));
    }, [policyTerm, paymentMode]);

    const handleReset = () => {
        setSelectedAdvisorId("");
        setSelectedClientId("");
        setClientSearch("");
        setRiders(SUNLIFE_RIDERS.map((r) => ({ ...r, selected: false, amount: 0 })));
        setBenefitsOpen(false);
        setPaymentMode("Annual");
        setPolicyTerm("");
        setCardData(EMPTY_CARD_DATA);
        setLibraryView("browse");
        setCardSize("medium");
    };

    const filteredClients = clients.filter((c) =>
        c.client_name.toLowerCase().includes(clientSearch.toLowerCase())
    );

    const selectedAdvisor = advisors.find((a) => a.id === selectedAdvisorId) || null;
    const selectedClient = clients.find((c) => c.id === selectedClientId) || null;
    const selectedRidersCount = riders.filter((r) => r.selected).length;

    const availableTemplates = TEMPLATE_LIBRARY[selectedCategory] || [];
    const activeTemplate = availableTemplates.find(t => t.id === selectedTemplateId) || TEMPLATE_LIBRARY["Cards"][0];
    const FIELD_POSITIONS = activeTemplate.fieldPositions;

    const openCategory = (cat: TemplateCategory) => {
        setSelectedCategory(cat);
        setLibraryView("files");
    };

    const openTemplate = (id: string) => {
        setSelectedTemplateId(id);
        setLibraryView("editor");
    };

    const loadTemplateImage = (src: string): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    };

    const handleExport = async (format: "png" | "jpeg" | "pdf") => {
        setExporting(true);
        try {
            const scale = 2;
            const canvas = document.createElement("canvas");
            canvas.width = activeTemplate.width * scale;
            canvas.height = activeTemplate.height * scale;
            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const templateImg = await loadTemplateImage(activeTemplate.src);
            ctx.drawImage(templateImg, 0, 0, canvas.width, canvas.height);

            const hasEffective = Boolean(cardData.effectiveDate);
            const hasMaturity = Boolean(cardData.maturityDate);

            const effectivePosOriginal = FIELD_POSITIONS.effectiveDate;
            const maturityPosOriginal = FIELD_POSITIONS.maturityDate;
            const centerX = effectivePosOriginal && maturityPosOriginal
                ? (effectivePosOriginal.left + (effectivePosOriginal.width / 2) + maturityPosOriginal.left + (maturityPosOriginal.width / 2)) / 2
                : activeTemplate.width / 2;

            (Object.keys(FIELD_POSITIONS) as (keyof PolicyCardData)[]).forEach((key) => {
                const pos = FIELD_POSITIONS[key];
                if (!pos) return;

                const rawValue = cardData[key];
                if (!rawValue) return;

                const value = key === "effectiveDate" || key === "maturityDate" ? formatDateDisplay(rawValue) : rawValue;

                const maxWidthPx = pos.width * scale;
                const maxFontPx = pos.fontSize * scale;
                const fitted = fitFontSizePx(ctx, value, pos.fontWeight, maxWidthPx, maxFontPx, 10 * scale);

                ctx.font = `${pos.fontWeight} ${fitted}px ${FONT_FAMILY}`;
                ctx.fillStyle = pos.color;
                ctx.textBaseline = "top";
                ctx.textAlign = pos.align as CanvasTextAlign;

                let leftPx = pos.left * scale;
                let widthPx = pos.width * scale;

                if (key === "effectiveDate" && !hasMaturity && effectivePosOriginal) {
                    leftPx = (centerX - (pos.width / 2)) * scale;
                } else if (key === "maturityDate" && !hasEffective && maturityPosOriginal) {
                    leftPx = (centerX - (pos.width / 2)) * scale;
                }

                const tx = pos.align === "center" ? leftPx + widthPx / 2 : pos.align === "right" ? leftPx + widthPx : leftPx;

                ctx.fillText(value, tx, pos.top * scale);
            });

            if (format === "pdf") {
                const imgData = canvas.toDataURL("image/png");
                const printWindow = window.open("", "_blank");
                if (printWindow) {
                    printWindow.document.write(
                        `<html><head><title>${activeTemplate.name}</title><style>body{margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#fff;}img{max-width:100%;max-height:100%;object-fit:contain;}@page{size:auto;margin:0mm;}@media print{body{-webkit-print-color-adjust:exact;}img{width:100%;height:100%;}}</style></head><body><img src="${imgData}" onload="window.print(); window.close();" /></body></html>`
                    );
                    printWindow.document.close();
                }
            } else {
                const link = document.createElement("a");
                const clientLabel = (selectedClient?.client_name || "card").replace(/[^a-z0-9]+/gi, "_");
                const templateLabel = activeTemplate.name.replace(/[^a-z0-9]+/gi, "");
                link.download = `${templateLabel}_${clientLabel}_${Date.now()}.${format}`;
                link.href = canvas.toDataURL(`image/${format === "jpeg" ? "jpeg" : "png"}`);
                link.click();
            }
        } finally {
            setExporting(false);
        }
    };

    const renderFieldOverlay = (key: keyof PolicyCardData) => {
        const pos = FIELD_POSITIONS[key];
        if (!pos) return null;

        const rawValue = cardData[key];
        if (!rawValue) return null;

        const value = key === "effectiveDate" || key === "maturityDate" ? formatDateDisplay(rawValue) : rawValue;

        const ctx = getMeasureCtx();
        const fitted = ctx ? fitFontSizePx(ctx, value, pos.fontWeight, pos.width, pos.fontSize, 10) : pos.fontSize;

        const hasEffective = Boolean(cardData.effectiveDate);
        const hasMaturity = Boolean(cardData.maturityDate);

        const effectivePosOriginal = FIELD_POSITIONS.effectiveDate;
        const maturityPosOriginal = FIELD_POSITIONS.maturityDate;
        const centerX = effectivePosOriginal && maturityPosOriginal
            ? (effectivePosOriginal.left + (effectivePosOriginal.width / 2) + maturityPosOriginal.left + (maturityPosOriginal.width / 2)) / 2
            : activeTemplate.width / 2;

        let renderLeft = pos.left;

        if (key === "effectiveDate" && !hasMaturity && effectivePosOriginal) {
            renderLeft = centerX - (pos.width / 2);
        } else if (key === "maturityDate" && !hasEffective && maturityPosOriginal) {
            renderLeft = centerX - (pos.width / 2);
        }

        return (
            <div
                key={key}
                className={styles.fieldOverlay}
                style={{
                    left: renderLeft,
                    top: pos.top,
                    width: pos.width,
                    fontSize: fitted,
                    fontWeight: pos.fontWeight,
                    color: pos.color,
                    textAlign: pos.align,
                    fontFamily: FONT_FAMILY
                }}
            >
                {value}
            </div>
        );
    };

    const previewCardClass =
        cardSize === "small" ? styles.cardSmall : cardSize === "large" ? styles.cardLarge : styles.card;

    return (
        <div className={styles.page}>
            <Sidebar />
            <div className={styles.main}>
                <Header />
                <main className={styles.content}>
                    <div className={styles.headerRow}>
                        <div>
                            <h1 className={styles.pageTitle}>Design Library</h1>
                            <p className={styles.pageSubtitle}>Manage and generate your marketing and client materials</p>
                        </div>
                        <button type="button" onClick={handleReset} className={styles.resetButton}>
                            <RotateCcw size={14} /> Reset
                        </button>
                    </div>

                    <div className={styles.breadcrumbRow}>
                        <button type="button" className={styles.breadcrumbItem} onClick={() => setLibraryView("browse")}>
                            <LayoutGrid size={13} /> Library
                        </button>
                        {libraryView !== "browse" && (
                            <>
                                <ChevronRight size={13} className={styles.breadcrumbSep} />
                                <button
                                    type="button"
                                    className={`${styles.breadcrumbItem} ${libraryView === "files" ? styles.breadcrumbItemActive : ""}`}
                                    onClick={() => setLibraryView("files")}
                                >
                                    {selectedCategory}
                                </button>
                            </>
                        )}
                        {libraryView === "editor" && (
                            <>
                                <ChevronRight size={13} className={styles.breadcrumbSep} />
                                <span className={`${styles.breadcrumbItem} ${styles.breadcrumbItemActive}`}>
                                    {activeTemplate.name} • {activeTemplate.width}×{activeTemplate.height}
                                </span>
                            </>
                        )}
                    </div>

                    {libraryView === "browse" && (
                        <div className={styles.folderGrid}>
                            {TEMPLATE_CATEGORIES.map((cat) => {
                                const count = TEMPLATE_LIBRARY[cat].length;
                                return (
                                    <button type="button" key={cat} className={styles.folderCard} onClick={() => openCategory(cat)}>
                                        <span className={styles.folderIconWrap}>
                                            <Folder size={20} />
                                        </span>
                                        <span className={styles.folderMeta}>
                                            <span className={styles.folderName}>{cat}</span>
                                            <span className={styles.folderCount}>{count} {count === 1 ? "item" : "items"}</span>
                                        </span>
                                        <ChevronRight size={16} className={styles.folderArrow} />
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {libraryView === "files" && (
                        <div className={styles.filesPanel}>
                            <button type="button" className={styles.backLink} onClick={() => setLibraryView("browse")}>
                                <ArrowLeft size={13} /> Back to Library
                            </button>

                            {availableTemplates.length > 0 ? (
                                <div className={styles.fileGrid}>
                                    {availableTemplates.map((t) => (
                                        <button type="button" key={t.id} className={styles.fileCard} onClick={() => openTemplate(t.id)}>
                                            <span className={styles.fileThumbWrap}>
                                                {thumbErrors[t.id] ? (
                                                    <span className={styles.fileThumbFallback}>
                                                        <FileText size={22} />
                                                        <span className={styles.fileThumbFallbackText}>Preview unavailable</span>
                                                    </span>
                                                ) : (
                                                    <img
                                                        src={t.src}
                                                        alt={t.name}
                                                        className={styles.fileThumb}
                                                        onError={() => setThumbErrors((prev) => ({ ...prev, [t.id]: true }))}
                                                    />
                                                )}
                                                <span className={styles.fileBadge}>{selectedCategory}</span>
                                                <span className={styles.fileHoverCta}>
                                                    <FileText size={12} /> Open template
                                                </span>
                                            </span>
                                            <span className={styles.fileName}>
                                                <FileText size={13} /> {t.name} • {t.width}×{t.height}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className={styles.emptyState}>
                                    <FileText size={22} />
                                    <p>No files in this folder yet</p>
                                </div>
                            )}
                        </div>
                    )}

                    {libraryView === "editor" && (
                        <div className={styles.layout}>
                            <div className={styles.panel}>
                                <button type="button" className={styles.backLink} onClick={() => setLibraryView("files")}>
                                    <ArrowLeft size={13} /> Back to {selectedCategory}
                                </button>

                                <div className={styles.panelGroup}>
                                    <h4 className={styles.panelGroupHeader}>
                                        <Users size={14} /> Advisor & Client
                                    </h4>

                                    <div className={styles.field}>
                                        <label className={styles.label}>Card Size</label>
                                        <select value={cardSize} onChange={(e) => setCardSize(e.target.value as any)} className={styles.select}>
                                            <option value="small">Small (preview ~480×303)</option>
                                            <option value="medium">Medium (preview ~800×505)</option>
                                            <option value="large">Large (preview ~1120×707)</option>
                                        </select>
                                    </div>

                                    <div className={styles.field}>
                                        <label className={styles.label}>Advisor *</label>
                                        <select
                                            value={selectedAdvisorId}
                                            onChange={(e) => setSelectedAdvisorId(e.target.value)}
                                            className={styles.select}
                                            disabled={advisorsLoading}
                                        >
                                            <option value="">{advisorsLoading ? "Loading advisors..." : "Choose an advisor"}</option>
                                            {advisors.map((a) => (
                                                <option key={a.id} value={a.id}>{a.advisor_name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className={styles.field}>
                                        <label className={styles.label}>Client *</label>
                                        <div className={styles.searchWrap}>
                                            <Search size={13} className={styles.searchIcon} />
                                            <input
                                                type="text"
                                                placeholder={selectedAdvisorId ? "Search client..." : "Select an advisor first"}
                                                value={clientSearch}
                                                onChange={(e) => setClientSearch(e.target.value)}
                                                disabled={!selectedAdvisorId}
                                                className={styles.searchInput}
                                            />
                                        </div>
                                        <div className={styles.clientList}>
                                            {clientsLoading && <div className={styles.clientListEmpty}>Loading clients...</div>}
                                            {!clientsLoading && selectedAdvisorId && filteredClients.length === 0 && (
                                                <div className={styles.clientListEmpty}>No clients found</div>
                                            )}
                                            {!clientsLoading &&
                                                filteredClients.map((c) => (
                                                    <button
                                                        type="button"
                                                        key={c.id}
                                                        onClick={() => setSelectedClientId(c.id)}
                                                        className={`${styles.clientItem} ${selectedClientId === c.id ? styles.clientItemActive : ""}`}
                                                    >
                                                        <span className={styles.clientItemName}>{c.client_name}</span>
                                                        {c.policy_number && <span className={styles.clientItemMeta}>{c.policy_number}</span>}
                                                    </button>
                                                ))}
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.panelGroup}>
                                    <h4 className={styles.panelGroupHeader}>
                                        <FileText size={14} /> Policy Information
                                    </h4>
                                    <div className={styles.field}>
                                        <label className={styles.label}>Policy Insured</label>
                                        <input
                                            type="text"
                                            value={cardData.policyInsured}
                                            onChange={(e) => handleFieldChange("policyInsured", e.target.value)}
                                            className={styles.input}
                                        />
                                    </div>
                                    <div className={styles.field}>
                                        <label className={styles.label}>Policy Number</label>
                                        <input
                                            type="text"
                                            value={cardData.policyNumber}
                                            onChange={(e) => handleFieldChange("policyNumber", e.target.value)}
                                            className={styles.input}
                                        />
                                    </div>
                                    <div className={styles.field}>
                                        <label className={styles.label}>Policy Coverage</label>
                                        <input
                                            type="text"
                                            value={cardData.policyCoverage}
                                            onChange={(e) => handleFieldChange("policyCoverage", e.target.value)}
                                            className={styles.input}
                                        />
                                    </div>
                                </div>

                                <div className={styles.panelGroup}>
                                    <h4 className={styles.panelGroupHeader}>
                                        <ShieldCheck size={14} /> Additional Benefits
                                    </h4>
                                    <div className={styles.multiSelect} ref={benefitsRef}>
                                        <button
                                            type="button"
                                            className={styles.multiSelectTrigger}
                                            onClick={() => setBenefitsOpen((o) => !o)}
                                        >
                                            <span>
                                                {selectedRidersCount > 0
                                                    ? `${selectedRidersCount} benefit${selectedRidersCount > 1 ? "s" : ""} selected`
                                                    : "Select benefits"}
                                            </span>
                                            <ChevronDown size={14} className={benefitsOpen ? styles.chevronOpen : styles.chevron} />
                                        </button>

                                        {selectedRidersCount > 0 && (
                                            <div className={styles.chipRow}>
                                                {riders.filter((r) => r.selected).map((r) => (
                                                    <span key={r.id} className={styles.chip}>
                                                        {r.code}
                                                        <button
                                                            type="button"
                                                            className={styles.chipRemove}
                                                            onClick={() => toggleRider(r.id, false)}
                                                        >
                                                            <X size={10} />
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        {benefitsOpen && (
                                            <div className={styles.multiSelectPanel}>
                                                {riders.map((r) => (
                                                    <div key={r.id} className={styles.multiSelectItem}>
                                                        <label className={styles.multiSelectItemHeader}>
                                                            <input
                                                                type="checkbox"
                                                                checked={r.selected}
                                                                onChange={(e) => toggleRider(r.id, e.target.checked)}
                                                            />
                                                            <span className={styles.riderTextWrap}>
                                                                <span className={styles.riderCode}>{r.code}</span>
                                                                <span className={styles.riderFullName}>{r.fullName}</span>
                                                            </span>
                                                        </label>
                                                        {r.selected && (
                                                            <input
                                                                type="text"
                                                                value={r.amount ? r.amount.toLocaleString("en-US") : ""}
                                                                onChange={(e) => updateRiderAmount(r.id, e.target.value)}
                                                                className={styles.multiSelectAmount}
                                                                placeholder={r.type === "daily" ? "Daily amount e.g. 1500" : "Amount e.g. 500000"}
                                                            />
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className={styles.panelGroup}>
                                    <h4 className={styles.panelGroupHeader}>
                                        <Calculator size={14} /> Payment Years Calculator
                                    </h4>
                                    <div className={styles.calcGrid}>
                                        <div className={styles.field}>
                                            <label className={styles.label}>Policy Term (Years)</label>
                                            <input
                                                type="number"
                                                value={policyTerm}
                                                onChange={(e) => setPolicyTerm(e.target.value)}
                                                className={styles.input}
                                                placeholder="e.g. 10"
                                            />
                                        </div>
                                        <div className={styles.field}>
                                            <label className={styles.label}>Payment Mode</label>
                                            <select
                                                value={paymentMode}
                                                onChange={(e) => setPaymentMode(e.target.value as any)}
                                                className={styles.input}
                                            >
                                                <option value="Annual">Annual</option>
                                                <option value="Quarterly">Quarterly</option>
                                                <option value="Monthly">Monthly</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.panelGroup}>
                                    <h4 className={styles.panelGroupHeader}>
                                        <Wallet size={14} /> Premium Details
                                    </h4>
                                    <div className={styles.fieldRow3}>
                                        <div className={styles.field}>
                                            <label className={styles.label}>Annual</label>
                                            <input
                                                type="text"
                                                value={cardData.annualPremium}
                                                onChange={(e) => handleFieldChange("annualPremium", e.target.value)}
                                                className={styles.input}
                                            />
                                        </div>
                                        <div className={styles.field}>
                                            <label className={styles.label}>Quarterly</label>
                                            <input
                                                type="text"
                                                value={cardData.quarterlyPremium}
                                                onChange={(e) => handleFieldChange("quarterlyPremium", e.target.value)}
                                                className={styles.input}
                                            />
                                        </div>
                                        <div className={styles.field}>
                                            <label className={styles.label}>Monthly</label>
                                            <input
                                                type="text"
                                                value={cardData.monthlyPremium}
                                                onChange={(e) => handleFieldChange("monthlyPremium", e.target.value)}
                                                className={styles.input}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.panelGroup}>
                                    <h4 className={styles.panelGroupHeader}>
                                        <CalendarDays size={14} /> Dates
                                    </h4>
                                    <div className={styles.fieldRow2}>
                                        <div className={styles.field}>
                                            <label className={styles.label}>Effective Date</label>
                                            <input
                                                type="date"
                                                value={cardData.effectiveDate}
                                                onChange={(e) => handleFieldChange("effectiveDate", e.target.value)}
                                                className={styles.input}
                                            />
                                        </div>
                                        <div className={styles.field}>
                                            <label className={styles.label}>Maturity Date</label>
                                            <input
                                                type="date"
                                                value={cardData.maturityDate}
                                                onChange={(e) => handleFieldChange("maturityDate", e.target.value)}
                                                className={styles.input}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.panelGroup}>
                                    <h4 className={styles.panelGroupHeader}>
                                        <Phone size={14} /> Contact Details
                                    </h4>
                                    <div className={styles.field}>
                                        <label className={styles.label}>Mobile Number</label>
                                        <input
                                            type="text"
                                            value={cardData.mobileNumber}
                                            onChange={(e) => handleFieldChange("mobileNumber", e.target.value)}
                                            className={styles.input}
                                        />
                                    </div>
                                    <div className={styles.field}>
                                        <label className={styles.label}>Email</label>
                                        <input
                                            type="email"
                                            value={cardData.email}
                                            onChange={(e) => handleFieldChange("email", e.target.value)}
                                            className={styles.input}
                                        />
                                    </div>
                                    <div className={styles.field}>
                                        <label className={styles.label}>Address</label>
                                        <input
                                            type="text"
                                            value={cardData.address}
                                            onChange={(e) => handleFieldChange("address", e.target.value)}
                                            className={styles.input}
                                        />
                                    </div>
                                </div>

                                <div className={styles.panelGroup}>
                                    <h4 className={styles.panelGroupHeader}>
                                        <Download size={14} /> Export
                                    </h4>
                                    <div className={styles.exportRow}>
                                        <button type="button" disabled={exporting || !activeTemplate} onClick={() => handleExport("png")} className={styles.exportButton}>
                                            {exporting ? <Loader2 size={14} className={styles.spin} /> : <ImageDown size={14} />} PNG
                                        </button>
                                        <button type="button" disabled={exporting || !activeTemplate} onClick={() => handleExport("jpeg")} className={styles.exportButton}>
                                            {exporting ? <Loader2 size={14} className={styles.spin} /> : <ImageDown size={14} />} JPEG
                                        </button>
                                        <button type="button" disabled={exporting || !activeTemplate} onClick={() => handleExport("pdf")} className={styles.exportButton}>
                                            {exporting ? <Loader2 size={14} className={styles.spin} /> : <FileType2 size={14} />} PDF
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className={styles.previewColumn}>
                                <div className={styles.previewToolbar}>
                                    <span>Live Preview</span>
                                    <div className={styles.zoomControl}>
                                        <span>Zoom: {zoom}%</span>
                                        <input
                                            type="range"
                                            min="40"
                                            max="150"
                                            value={zoom}
                                            onChange={(e) => setZoom(Number(e.target.value))}
                                            className={styles.zoomSlider}
                                        />
                                    </div>
                                </div>

                                <div className={styles.previewFrame}>
                                    <div className={styles.previewScaleWrap} style={{ transform: `scale(${zoom / 100})` }}>
                                        <div
                                            className={`${styles.card} ${previewCardClass === styles.card ? "" : previewCardClass}`}
                                            style={{
                                                width: previewCardClass === styles.cardSmall ? undefined : undefined,
                                                height: undefined,
                                                backgroundImage: `url(${activeTemplate.src})`,
                                                opacity: activeTemplate.src ? 1 : 0,
                                                position: "relative"
                                            }}
                                        >
                                            {(Object.keys(FIELD_POSITIONS) as (keyof PolicyCardData)[]).map((key) => renderFieldOverlay(key))}
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.previewSummary}>
                                    <span className={styles.previewSummaryItem}>
                                        <Users size={12} /> {selectedAdvisor ? selectedAdvisor.advisor_name : "No advisor selected"}
                                    </span>
                                    {selectedClient && (
                                        <span className={styles.previewSummaryItem}>
                                            <FileText size={12} /> {selectedClient.client_name}
                                        </span>
                                    )}
                                    <span className={styles.previewSummaryItem}>
                                        {activeTemplate.name} • {activeTemplate.width}×{activeTemplate.height}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}