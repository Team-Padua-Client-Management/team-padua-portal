"use client";

/**
 * page.tsx
 *
 * Main component module in features path: app/(admin)/admin/Design/page.tsx
 *
 * Responsibilities:
 * - Scopes UI state management and user actions.
 * - Bridges layout rendering with server-side Supabase data connections.
 * - Handles modular presentation logic.
 */

;


// ======================================================
// State Initialization & Hooks
// ======================================================

// ======================================================
// Lifecycle Effects & Data Sync
// ======================================================
import styles from "@/styles/admin/Design/page.module.css"; import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/app/lib/supabase/client";
import * as Lucide from "lucide-react";
import Header from "@/app/components/admin/AdminHeader/page";
import Sidebar from "@/app/components/admin/AdminSidebar/page";

interface DesignFolder {
    id: string;
    name: string;
    created_at: string;
}

interface DesignTemplate {
    id: string;
    folder_id: string;
    name: string;
    background: string;
    thumbnail: string | null;
    variables: Record<string, any>;
    created_at: string;
}

interface Layer {
    id: string;
    type: "text" | "image" | "shape" | "icon";
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    opacity: number;
    z_index: number;
    text?: string;
    font_family?: string;
    font_size?: number;
    color?: string;
    image_url?: string;
    shape_type?: "rectangle" | "circle" | "triangle";
    icon_name?: string;
    visible?: boolean;
    locked?: boolean;
    metadata?: Record<string, any>;
}

interface FormVariables {
    client_name: string;
    advisor_name: string;
    fund_value: string;
    date: string;
}

const initialFormVariables: FormVariables = {
    client_name: "Juan Dela Cruz",
    advisor_name: "Daniel Padua",
    fund_value: "PHP 7,238",
    date: "July 17, 2023"
};

const stockPhotos = [
    "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600",
    "https://images.unsplash.com/photo-1557683316-973673baf926?w=600",
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600",
    "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600",
    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600"
];

const stockIcons = [
    "Star", "Heart", "Smile", "Phone", "Mail", "Globe", "MapPin", "Award", "CheckCircle", "Info",
    "Briefcase", "User", "Shield", "Zap", "TrendingUp", "DollarSign", "Target", "Calendar"
];

/**
 * DesignPage
 *
 * Renders the DesignPage interface, managing local lifecycles
 * and user interactions.
 */
/**
 * Executes operations logic for DesignPage.
 *
 * 
 * @returns State operations sequence.
 */
export default function DesignPage() {
    const [view, setView] = useState<"folders" | "templates" | "editor">("folders");
    const [dbMode, setDbMode] = useState<"new_schema" | "old_schema" | "local">("local");
    const [folders, setFolders] = useState<DesignFolder[]>([]);
    const [templates, setTemplates] = useState<DesignTemplate[]>([]);
    const [selectedFolder, setSelectedFolder] = useState<DesignFolder | null>(null);
    const [selectedTemplate, setSelectedTemplate] = useState<DesignTemplate | null>(null);
    const [layers, setLayers] = useState<Layer[]>([]);
    const [variables, setVariables] = useState<FormVariables>(initialFormVariables);
    const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
    const [zoom, setZoom] = useState<number>(100);
    const [canvasBgColor, setCanvasBgColor] = useState<string>("#FFFFFF");
    const [canvasBgImage, setCanvasBgImage] = useState<string>("");
    const [history, setHistory] = useState<Layer[][]>([]);
    const [historyIndex, setHistoryIndex] = useState<number>(-1);
    const [loading, setLoading] = useState<boolean>(true);
    const [saving, setSaving] = useState<boolean>(false);
    const [saveStatus, setSaveStatus] = useState<"Saved" | "Saving..." | "Sync Error">("Saved");
    const [folderModalOpen, setFolderModalOpen] = useState<boolean>(false);
    const [newFolderName, setNewFolderName] = useState<string>("");
    const [templateModalOpen, setTemplateModalOpen] = useState<boolean>(false);
    const [newTemplateName, setNewTemplateName] = useState<string>("");
    const [newTemplateBgUrl, setNewTemplateBgUrl] = useState<string>("");
    const [newTemplateFile, setNewTemplateFile] = useState<File | null>(null);
    const [downloadModalOpen, setDownloadModalOpen] = useState<boolean>(false);
    const [downloadFormat, setDownloadFormat] = useState<"png" | "jpeg" | "pdf">("png");
    const [aiModalOpen, setAiModalOpen] = useState<boolean>(false);
    const [aiAnalyzing, setAiAnalyzing] = useState<boolean>(false);
    const [aiStep, setAiStep] = useState<string>("");
    const [aiFile, setAiFile] = useState<File | null>(null);
    const [activeSidebarTab, setActiveSidebarTab] = useState<"templates" | "text" | "shapes" | "uploads" | "photos" | "icons" | "layers">("templates");
    const [iconSearchQuery, setIconSearchQuery] = useState<string>("");
    const [deletingFolderId, setDeletingFolderId] = useState<string | null>(null);
    const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(null);

    const canvasContainerRef = useRef<HTMLDivElement | null>(null);

    const canvasWidth = 800;
    const canvasHeight = 600;

    useEffect(() => {
        detectSchemaAndFetch();
    }, []);

    useEffect(() => {
        if (view !== "editor" || !selectedTemplate) return;
        const timer = setTimeout(() => {
            handleAutosave();
        }, 1500);
        return () => clearTimeout(timer);
    }, [layers, variables, canvasBgColor, canvasBgImage]);

    /**
 * Executes operations logic for detectSchemaAndFetch.
 *
 * 
 * @returns State operations sequence.
 */
    const detectSchemaAndFetch = async () => {
        setLoading(true);
        try {
            const { data: testDesigns, error: testError } = await /* Query database records from active repository grid */ supabase.from("designs").select("id").limit(1);
            if (!testError) {
                setDbMode("new_schema");
                const { data: folderData } = await /* Query database records from active repository grid */ supabase.from("design_folders").select("*").order("created_at", { ascending: false });
                setFolders(folderData || []);
            } else {
                const { data: testTemplates, error: tplError } = await /* Query database records from active repository grid */ supabase.from("design_templates").select("id").limit(1);
                if (!tplError) {
                    setDbMode("old_schema");
                    const { data: folderData } = await /* Query database records from active repository grid */ supabase.from("design_folders").select("*").order("created_at", { ascending: false });
                    setFolders(folderData || []);
                } else {
                    setDbMode("local");
                    const localFolders = localStorage.getItem("local_design_folders");
                    if (localFolders) {
                        setFolders(JSON.parse(localFolders));
                    } else {
                        const demoFolders: DesignFolder[] = [
                            { id: "demo-folder-1", name: "Marketing Collaterals", created_at: new Date().toISOString() },
                            { id: "demo-folder-2", name: "Client Onboarding", created_at: new Date().toISOString() }
                        ];
                        localStorage.setItem("local_design_folders", JSON.stringify(demoFolders));
                        setFolders(demoFolders);
                    }
                }
            }
        } catch (err) {
            setDbMode("local");
        } finally {
            setLoading(false);
        }
    };

    /**
 * Executes operations logic for fetchTemplates.
 *
 * @param folderId: string
 * @returns State operations sequence.
 */
    const fetchTemplates = async (folderId: string) => {
        setLoading(true);
        try {
            if (dbMode === "new_schema") {
                const { data } = await /* Query database records from active repository grid */ supabase.from("designs").select("*").eq("folder_id", folderId).order("created_at", { ascending: false });
                setTemplates(data || []);
            } else if (dbMode === "old_schema") {
                const { data } = await /* Query database records from active repository grid */ supabase.from("design_templates").select("*").eq("folder_id", folderId).order("created_at", { ascending: false });
                setTemplates(data || []);
            } else {
                const localTemplates = localStorage.getItem(`local_templates_${folderId}`);
                if (localTemplates) {
                    setTemplates(JSON.parse(localTemplates));
                } else {
                    const demoTemplates: DesignTemplate[] = [
                        { id: `demo-template-${folderId}-1`, folder_id: folderId, name: "Premium Client Welcome Banner", background: "https://images.unsplash.com/photo-1557683316-973673baf926?w=800", thumbnail: null, variables: initialFormVariables, created_at: new Date().toISOString() },
                        { id: `demo-template-${folderId}-2`, folder_id: folderId, name: "Corporate Financial Flyer", background: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800", thumbnail: null, variables: initialFormVariables, created_at: new Date().toISOString() }
                    ];
                    localStorage.setItem(`local_templates_${folderId}`, JSON.stringify(demoTemplates));
                    setTemplates(demoTemplates);
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    /**
 * Executes operations logic for fetchLayers.
 *
 * @param templateId: string
 * @returns State operations sequence.
 */
    const fetchLayers = async (templateId: string) => {
        try {
            if (dbMode === "new_schema") {
                const { data } = await /* Query database records from active repository grid */ supabase.from("layers").select("*").eq("design_id", templateId).order("z_index", { ascending: true });
                if (data && data.length > 0) {
                    const loaded = data.map((l: any) => ({
                        ...l,
                        opacity: l.opacity !== undefined ? l.opacity : 1,
                        visible: l.visible !== undefined ? l.visible : true,
                        locked: l.locked !== undefined ? l.locked : false,
                        metadata: typeof l.metadata === "string" ? JSON.parse(l.metadata) : l.metadata || {}
                    }));
                    setLayers(loaded);
                    setHistory([loaded]);
                    setHistoryIndex(0);
                } else {
                    initDefaultLayers(templateId);
                }
            } else if (dbMode === "old_schema") {
                const { data } = await /* Query database records from active repository grid */ supabase.from("design_elements").select("*").eq("template_id", templateId);
                if (data && data.length > 0) {
                    const loaded = data.map((el: any, index: number) => {
                        const isShape = el.type === "shape";
                        const isImage = el.type === "image";
                        return {
                            id: el.id,
                            type: el.type as any,
                            x: el.x,
                            y: el.y,
                            width: isShape || isImage ? el.size : 300,
                            height: isShape ? (Number(el.font) || el.size) : isImage ? (Number(el.font) || el.size) : 50,
                            rotation: 0,
                            opacity: el.opacity !== undefined ? el.opacity : 1,
                            z_index: index,
                            text: el.text,
                            font_family: !isShape && !isImage ? el.font : "Inter",
                            font_size: !isShape && !isImage ? el.size : 16,
                            color: el.color,
                            image_url: isImage ? el.text : undefined,
                            shape_type: isShape ? ((el.text === "circle" ? "circle" : "rectangle") as "rectangle" | "circle" | "triangle") : undefined,
                            visible: true,
                            locked: false,
                            metadata: {
                                variable_key: el.variable_key
                            }
                        };
                    });
                    setLayers(loaded);
                    setHistory([loaded]);
                    setHistoryIndex(0);
                } else {
                    initDefaultLayers(templateId);
                }
            } else {
                const localLayers = localStorage.getItem(`local_layers_${templateId}`);
                if (localLayers) {
                    const parsed = JSON.parse(localLayers);
                    setLayers(parsed);
                    setHistory([parsed]);
                    setHistoryIndex(0);
                } else {
                    initDefaultLayers(templateId);
                }
            }
        } catch (err) {
            initDefaultLayers(templateId);
        }
    };

    /**
 * Executes operations logic for initDefaultLayers.
 *
 * @param templateId: string
 * @returns State operations sequence.
 */
    const initDefaultLayers = (templateId: string) => {
        const defaults: Layer[] = [
            {
                id: `layer-${Date.now()}-1`,
                type: "text",
                x: 80,
                y: 120,
                width: 640,
                height: 80,
                rotation: 0,
                opacity: 1,
                z_index: 1,
                text: "WELCOME TO THE BRAND PLATFORM",
                font_family: "Inter",
                font_size: 40,
                color: "#000000",
                visible: true,
                locked: false,
                metadata: { bold: true, align: "left" }
            },
            {
                id: `layer-${Date.now()}-2`,
                type: "text",
                x: 80,
                y: 220,
                width: 300,
                height: 40,
                rotation: 0,
                opacity: 1,
                z_index: 2,
                text: "Juan Dela Cruz",
                font_family: "serif",
                font_size: 24,
                color: "#A3843B",
                visible: true,
                locked: false,
                metadata: { bold: true, variable_key: "client_name" }
            },
            {
                id: `layer-${Date.now()}-3`,
                type: "text",
                x: 80,
                y: 280,
                width: 300,
                height: 40,
                rotation: 0,
                opacity: 1,
                z_index: 3,
                text: "Daniel Padua",
                font_family: "Inter",
                font_size: 18,
                color: "#000000",
                visible: true,
                locked: false,
                metadata: { variable_key: "advisor_name" }
            },
            {
                id: `layer-${Date.now()}-4`,
                type: "shape",
                x: 80,
                y: 350,
                width: 280,
                height: 120,
                rotation: 0,
                opacity: 0.9,
                z_index: 4,
                color: "#FFF7D6",
                shape_type: "rectangle",
                visible: true,
                locked: false,
                metadata: { border_radius: 8, stroke_color: "#F4C542", stroke_width: 2 }
            },
            {
                id: `layer-${Date.now()}-5`,
                type: "text",
                x: 100,
                y: 370,
                width: 240,
                height: 30,
                rotation: 0,
                opacity: 1,
                z_index: 5,
                text: "TOTAL INVESTMENT VALUE",
                font_family: "Inter",
                font_size: 12,
                color: "#A3843B",
                visible: true,
                locked: false,
                metadata: { bold: true }
            },
            {
                id: `layer-${Date.now()}-6`,
                type: "text",
                x: 100,
                y: 400,
                width: 240,
                height: 50,
                rotation: 0,
                opacity: 1,
                z_index: 6,
                text: "PHP 7,238",
                font_family: "mono",
                font_size: 28,
                color: "#000000",
                visible: true,
                locked: false,
                metadata: { bold: true, variable_key: "fund_value" }
            }
        ];
        setLayers(defaults);
        setHistory([defaults]);
        setHistoryIndex(0);
    };

    /**
 * Executes operations logic for pushToHistory.
 *
 * @param newLayers: Layer[]
 * @returns State operations sequence.
 */
    const pushToHistory = (newLayers: Layer[]) => {
        const nextHistory = history.slice(0, historyIndex + 1);
        setHistory([...nextHistory, newLayers]);
        setHistoryIndex(nextHistory.length);
    };

    /**
 * Executes operations logic for handleUndo.
 *
 * 
 * @returns State operations sequence.
 */
    const handleUndo = () => {
        if (historyIndex > 0) {
            const prevIndex = historyIndex - 1;
            setHistoryIndex(prevIndex);
            setLayers(history[prevIndex]);
        }
    };

    /**
 * Executes operations logic for handleRedo.
 *
 * 
 * @returns State operations sequence.
 */
    const handleRedo = () => {
        if (historyIndex < history.length - 1) {
            const nextIndex = historyIndex + 1;
            setHistoryIndex(nextIndex);
            setLayers(history[nextIndex]);
        }
    };

    /**
 * Executes operations logic for updateLayers.
 *
 * @param updater: (prev: Layer[]
 * @returns State operations sequence.
 */
    const updateLayers = (updater: (prev: Layer[]) => Layer[]) => {
        setLayers((prev) => {
            const next = updater(prev);
            pushToHistory(next);
            return next;
        });
    };

    /**
 * Executes operations logic for handleCreateFolder.
 *
 * 
 * @returns State operations sequence.
 */
    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) return;
        try {
            if (dbMode !== "local") {
                const { data, error } = await /* Query database records from active repository grid */ supabase.from("design_folders").insert([{ name: newFolderName.trim() }]).select();
                if (error) throw error;
                if (data) setFolders([data[0], ...folders]);
            } else {
                const newFolder: DesignFolder = {
                    id: `local-folder-${Date.now()}`,
                    name: newFolderName.trim(),
                    created_at: new Date().toISOString()
                };
                const next = [newFolder, ...folders];
                setFolders(next);
                localStorage.setItem("local_design_folders", JSON.stringify(next));
            }
            setNewFolderName("");
            setFolderModalOpen(false);
        } catch (err: any) {
            alert(err.message);
        }
    };

    /**
     * Deletes a folder and all templates/layers nested inside it, across
     * whichever schema mode is currently active (new_schema / old_schema / local).
     *
     * @param folder: DesignFolder
     * @param e: React.MouseEvent - stopped so the card's onClick (open folder) doesn't fire
     * @returns Promise<void>
     */
    const handleDeleteFolder = async (folder: DesignFolder, e: React.MouseEvent) => {
        e.stopPropagation();
        const confirmed = window.confirm(
            `Delete "${folder.name}" and all templates inside it? This cannot be undone.`
        );
        if (!confirmed) return;

        setDeletingFolderId(folder.id);
        try {
            if (dbMode === "new_schema") {
                const { data: designsToDelete } = await supabase
                    .from("designs")
                    .select("id")
                    .eq("folder_id", folder.id);
                const designIds = (designsToDelete || []).map((d: any) => d.id);
                if (designIds.length > 0) {
                    await supabase.from("layers").delete().in("design_id", designIds);
                    await supabase.from("designs").delete().eq("folder_id", folder.id);
                }
                const { error } = await supabase.from("design_folders").delete().eq("id", folder.id);
                if (error) throw error;
            } else if (dbMode === "old_schema") {
                const { data: templatesToDelete } = await supabase
                    .from("design_templates")
                    .select("id")
                    .eq("folder_id", folder.id);
                const templateIds = (templatesToDelete || []).map((t: any) => t.id);
                if (templateIds.length > 0) {
                    await supabase.from("design_elements").delete().in("template_id", templateIds);
                    await supabase.from("design_templates").delete().eq("folder_id", folder.id);
                }
                const { error } = await supabase.from("design_folders").delete().eq("id", folder.id);
                if (error) throw error;
            } else {
                const localTemplatesRaw = localStorage.getItem(`local_templates_${folder.id}`);
                if (localTemplatesRaw) {
                    const localTemplates: DesignTemplate[] = JSON.parse(localTemplatesRaw);
                    localTemplates.forEach((t) => localStorage.removeItem(`local_layers_${t.id}`));
                }
                localStorage.removeItem(`local_templates_${folder.id}`);
            }

            const nextFolders = folders.filter((f) => f.id !== folder.id);
            setFolders(nextFolders);
            if (dbMode === "local") {
                localStorage.setItem("local_design_folders", JSON.stringify(nextFolders));
            }

            if (selectedFolder?.id === folder.id) {
                setSelectedFolder(null);
                setTemplates([]);
                setView("folders");
            }
        } catch (err: any) {
            alert(err.message || "Failed to delete folder.");
        } finally {
            setDeletingFolderId(null);
        }
    };

    /**
     * Executes operations logic for handleCreateTemplate.
     *
     * 
     * @returns State operations sequence.
     */
    const handleCreateTemplate = async () => {
        if (!newTemplateName.trim() || !selectedFolder) return;
        setSaving(true);
        try {
            let finalBgUrl = newTemplateBgUrl.trim();
            if (newTemplateFile) {
                const fileExt = newTemplateFile.name.split(".").pop();
                const fileName = `${Math.random()}.${fileExt}`;
                const filePath = `backgrounds/${fileName}`;
                const { error: uploadError } = await supabase.storage.from("design_assets").upload(filePath, newTemplateFile, { cacheControl: "3600", upsert: true });
                if (uploadError) throw uploadError;
                const { data: { publicUrl } } = supabase.storage.from("design_assets").getPublicUrl(filePath);
                finalBgUrl = publicUrl;
            }
            if (!finalBgUrl) finalBgUrl = "https://images.unsplash.com/photo-1557683316-973673baf926?w=800";

            if (dbMode === "new_schema") {
                const { data, error } = await /* Query database records from active repository grid */ supabase.from("designs").insert([{ folder_id: selectedFolder.id, title: newTemplateName.trim(), thumbnail: finalBgUrl, canvas_width: canvasWidth, canvas_height: canvasHeight }]).select();
                if (error) throw error;
                if (data) setTemplates([data[0], ...templates]);
            } else if (dbMode === "old_schema") {
                const { data, error } = await /* Query database records from active repository grid */ supabase.from("design_templates").insert([{ folder_id: selectedFolder.id, name: newTemplateName.trim(), background: finalBgUrl, thumbnail: finalBgUrl, variables: initialFormVariables }]).select();
                if (error) throw error;
                if (data) setTemplates([data[0], ...templates]);
            } else {
                const newTpl: DesignTemplate = {
                    id: `local-template-${Date.now()}`,
                    folder_id: selectedFolder.id,
                    name: newTemplateName.trim(),
                    background: finalBgUrl,
                    thumbnail: finalBgUrl,
                    variables: initialFormVariables,
                    created_at: new Date().toISOString()
                };
                const next = [newTpl, ...templates];
                setTemplates(next);
                localStorage.setItem(`local_templates_${selectedFolder.id}`, JSON.stringify(next));
            }
            setNewTemplateName("");
            setNewTemplateBgUrl("");
            setNewTemplateFile(null);
            setTemplateModalOpen(false);
        } catch (err: any) {
            alert(err.message);
        } finally {
            setSaving(false);
        }
    };

    /**
     * Deletes a single template (and its layers/elements) across all schema modes.
     *
     * @param template: DesignTemplate
     * @param e: React.MouseEvent - stopped so the card's onClick doesn't also open the editor
     * @returns Promise<void>
     */
    const handleDeleteTemplate = async (template: DesignTemplate, e: React.MouseEvent) => {
        e.stopPropagation();
        const confirmed = window.confirm(`Delete "${template.name}"? This cannot be undone.`);
        if (!confirmed) return;

        setDeletingTemplateId(template.id);
        try {
            if (dbMode === "new_schema") {
                await supabase.from("layers").delete().eq("design_id", template.id);
                const { error } = await supabase.from("designs").delete().eq("id", template.id);
                if (error) throw error;
            } else if (dbMode === "old_schema") {
                await supabase.from("design_elements").delete().eq("template_id", template.id);
                const { error } = await supabase.from("design_templates").delete().eq("id", template.id);
                if (error) throw error;
            } else {
                localStorage.removeItem(`local_layers_${template.id}`);
            }

            const nextTemplates = templates.filter((t) => t.id !== template.id);
            setTemplates(nextTemplates);
            if (dbMode === "local" && selectedFolder) {
                localStorage.setItem(`local_templates_${selectedFolder.id}`, JSON.stringify(nextTemplates));
            }

            if (selectedTemplate?.id === template.id) {
                setSelectedTemplate(null);
                setView("templates");
            }
        } catch (err: any) {
            alert(err.message || "Failed to delete template.");
        } finally {
            setDeletingTemplateId(null);
        }
    };

    /**
 * Executes operations logic for handleOpenTemplate.
 *
 * @param template: DesignTemplate
 * @returns State operations sequence.
 */
    const handleOpenTemplate = async (template: DesignTemplate) => {
        setSelectedTemplate(template);
        setVariables(template.variables && Object.keys(template.variables).length > 0 ? (template.variables as FormVariables) : initialFormVariables);
        setCanvasBgImage(template.background || "");
        setCanvasBgColor("#FFFFFF");
        setView("editor");
        await fetchLayers(template.id);
    };

    /**
 * Executes operations logic for handleAutosave.
 *
 * 
 * @returns State operations sequence.
 */
    const handleAutosave = async () => {
        if (!selectedTemplate) return;
        setSaveStatus("Saving...");
        try {
            if (dbMode === "new_schema") {
                await /* Query database records from active repository grid */ supabase.from("designs").update({ title: selectedTemplate.name, thumbnail: canvasBgImage || null, updated_at: new Date().toISOString() }).eq("id", selectedTemplate.id);
                await /* Query database records from active repository grid */ supabase.from("layers").delete().eq("design_id", selectedTemplate.id);
                if (layers.length > 0) {
                    const payloads = layers.map((l) => ({
                        design_id: selectedTemplate.id,
                        type: l.type,
                        x: l.x,
                        y: l.y,
                        width: l.width,
                        height: l.height,
                        rotation: l.rotation,
                        opacity: l.opacity,
                        z_index: l.z_index,
                        text: l.text || null,
                        font_family: l.font_family || null,
                        font_size: l.font_size || null,
                        color: l.color || null,
                        image_url: l.image_url || null,
                        shape_type: l.shape_type || null,
                        metadata: JSON.stringify(l.metadata || {})
                    }));
                    await /* Query database records from active repository grid */ supabase.from("layers").insert(payloads);
                }
            } else if (dbMode === "old_schema") {
                await /* Query database records from active repository grid */ supabase.from("design_templates").update({ name: selectedTemplate.name, background: canvasBgImage, variables }).eq("id", selectedTemplate.id);
                await /* Query database records from active repository grid */ supabase.from("design_elements").delete().eq("template_id", selectedTemplate.id);
                if (layers.length > 0) {
                    const payloads = layers.map((l) => {
                        const isShape = l.type === "shape";
                        const isImage = l.type === "image";
                        return {
                            template_id: selectedTemplate.id,
                            type: l.type,
                            text: isShape ? (l.shape_type || "rectangle") : isImage ? (l.image_url || "") : (l.text || ""),
                            x: l.x,
                            y: l.y,
                            font: isShape ? String(l.height) : isImage ? String(l.height) : (l.font_family || "Inter"),
                            size: isShape ? l.width : isImage ? l.width : (l.font_size || 16),
                            color: l.color || "#000000",
                            variable_key: l.metadata?.variable_key || null,
                            opacity: l.opacity
                        };
                    });
                    await /* Query database records from active repository grid */ supabase.from("design_elements").insert(payloads);
                }
            } else {
                localStorage.setItem(`local_layers_${selectedTemplate.id}`, JSON.stringify(layers));
                const updatedTpl = { ...selectedTemplate, variables, background: canvasBgImage };
                const folderTpls = templates.map(t => t.id === selectedTemplate.id ? updatedTpl : t);
                setTemplates(folderTpls);
                localStorage.setItem(`local_templates_${selectedTemplate.folder_id}`, JSON.stringify(folderTpls));
            }
            setSaveStatus("Saved");
        } catch (err) {
            setSaveStatus("Sync Error");
        }
    };

    /**
 * Executes operations logic for handlePointerDown.
 *
 * @param 
        e: React.PointerEvent,
        layerId: string,
        action: "dragging" | "resizing" | "rotating",
        handle?: string
    
 * @returns State operations sequence.
 */
    const handlePointerDown = (
        e: React.PointerEvent,
        layerId: string,
        action: "dragging" | "resizing" | "rotating",
        handle?: string
    ) => {
        const layer = layers.find(l => l.id === layerId);
        if (!layer || layer.locked) return;

        e.preventDefault();
        e.stopPropagation();
        setSelectedLayerId(layerId);

        const startX = e.clientX;
        const startY = e.clientY;
        const startLayerX = layer.x;
        const startLayerY = layer.y;
        const startWidth = layer.width;
        const startHeight = layer.height;
        const startRotation = layer.rotation || 0;

        /**
 * Executes operations logic for handlePointerMove.
 *
 * @param moveEvent: PointerEvent
 * @returns State operations sequence.
 */
        const handlePointerMove = (moveEvent: PointerEvent) => {
            const dx = (moveEvent.clientX - startX) / (zoom / 100);
            const dy = (moveEvent.clientY - startY) / (zoom / 100);

            setLayers((prev) =>
                prev.map((l) => {
                    if (l.id !== layerId) return l;

                    if (action === "dragging") {
                        return {
                            ...l,
                            x: Math.round(startLayerX + dx),
                            y: Math.round(startLayerY + dy)
                        };
                    }

                    if (action === "rotating") {
                        const container = canvasContainerRef.current;
                        if (!container) return l;
                        const rect = container.getBoundingClientRect();
                        const cx = rect.left + (startLayerX + startWidth / 2) * (zoom / 100);
                        const cy = rect.top + (startLayerY + startHeight / 2) * (zoom / 100);
                        const angle = Math.atan2(moveEvent.clientY - cy, moveEvent.clientX - cx);
                        let deg = angle * (180 / Math.PI) - 90;
                        if (deg < 0) deg += 360;
                        return {
                            ...l,
                            rotation: Math.round(deg)
                        };
                    }

                    if (action === "resizing" && handle) {
                        let newWidth = startWidth;
                        let newHeight = startHeight;
                        let newX = startLayerX;
                        let newY = startLayerY;

                        const rad = (startRotation * Math.PI) / 180;
                        const cos = Math.cos(rad);
                        const sin = Math.sin(rad);

                        const rotatedDx = dx * cos + dy * sin;
                        const rotatedDy = -dx * sin + dy * cos;

                        if (handle.includes("r")) {
                            newWidth = Math.max(10, startWidth + rotatedDx);
                        }
                        if (handle.includes("l")) {
                            const deltaW = rotatedDx;
                            newWidth = Math.max(10, startWidth - deltaW);
                            if (newWidth > 10) {
                                newX = startLayerX + deltaW * cos;
                                newY = startLayerY + deltaW * sin;
                            }
                        }
                        if (handle.includes("b")) {
                            newHeight = Math.max(10, startHeight + rotatedDy);
                        }
                        if (handle.includes("t")) {
                            const deltaH = rotatedDy;
                            newHeight = Math.max(10, startHeight - deltaH);
                            if (newHeight > 10) {
                                newX = newX - deltaH * sin;
                                newY = newY + deltaH * cos;
                            }
                        }

                        return {
                            ...l,
                            width: Math.round(newWidth),
                            height: Math.round(newHeight),
                            x: Math.round(newX),
                            y: Math.round(newY)
                        };
                    }

                    return l;
                })
            );
        };

        /**
 * Executes operations logic for handlePointerUp.
 *
 * 
 * @returns State operations sequence.
 */
        const handlePointerUp = () => {
            window.removeEventListener("pointermove", handlePointerMove);
            window.removeEventListener("pointerup", handlePointerUp);
            setLayers((currentLayers) => {
                pushToHistory(currentLayers);
                return currentLayers;
            });
        };

        window.addEventListener("pointermove", handlePointerMove);
        window.addEventListener("pointerup", handlePointerUp);
    };

    /**
 * Executes operations logic for handleAddTextLayer.
 *
 * @param presetSize: "heading" | "subheading" | "body"
 * @returns State operations sequence.
 */
    const handleAddTextLayer = (presetSize: "heading" | "subheading" | "body") => {
        const sizeMap = { heading: 36, subheading: 20, body: 14 };
        const textMap = { heading: "Add a Heading", subheading: "Add a Subheading", body: "Add body text here" };
        const newLayer: Layer = {
            id: `layer-${Date.now()}`,
            type: "text",
            x: 100,
            y: 150 + layers.length * 10,
            width: 400,
            height: sizeMap[presetSize] * 1.5,
            rotation: 0,
            opacity: 1,
            z_index: layers.length + 1,
            text: textMap[presetSize],
            font_family: "Inter",
            font_size: sizeMap[presetSize],
            color: "#000000",
            visible: true,
            locked: false,
            metadata: { bold: presetSize === "heading", align: "left" }
        };
        updateLayers((prev) => [...prev, newLayer]);
        setSelectedLayerId(newLayer.id);
    };

    /**
 * Executes operations logic for handleAddShapeLayer.
 *
 * @param shapeType: "rectangle" | "circle" | "triangle"
 * @returns State operations sequence.
 */
    const handleAddShapeLayer = (shapeType: "rectangle" | "circle" | "triangle") => {
        const newLayer: Layer = {
            id: `layer-${Date.now()}`,
            type: "shape",
            x: 150,
            y: 150 + layers.length * 10,
            width: 120,
            height: 120,
            rotation: 0,
            opacity: 1,
            z_index: layers.length + 1,
            color: "#F4C542",
            shape_type: shapeType,
            visible: true,
            locked: false,
            metadata: { border_radius: shapeType === "rectangle" ? 4 : 0 }
        };
        updateLayers((prev) => [...prev, newLayer]);
        setSelectedLayerId(newLayer.id);
    };

    /**
 * Executes operations logic for handleAddImageLayer.
 *
 * @param url: string
 * @returns State operations sequence.
 */
    const handleAddImageLayer = (url: string) => {
        const newLayer: Layer = {
            id: `layer-${Date.now()}`,
            type: "image",
            x: 150,
            y: 150 + layers.length * 10,
            width: 200,
            height: 150,
            rotation: 0,
            opacity: 1,
            z_index: layers.length + 1,
            image_url: url,
            visible: true,
            locked: false,
            metadata: { border_radius: 0 }
        };
        updateLayers((prev) => [...prev, newLayer]);
        setSelectedLayerId(newLayer.id);
    };

    /**
 * Executes operations logic for handleAddIconLayer.
 *
 * @param iconName: string
 * @returns State operations sequence.
 */
    const handleAddIconLayer = (iconName: string) => {
        const newLayer: Layer = {
            id: `layer-${Date.now()}`,
            type: "icon",
            x: 200,
            y: 200,
            width: 60,
            height: 60,
            rotation: 0,
            opacity: 1,
            z_index: layers.length + 1,
            color: "#000000",
            icon_name: iconName,
            visible: true,
            locked: false,
            metadata: {}
        };
        updateLayers((prev) => [...prev, newLayer]);
        setSelectedLayerId(newLayer.id);
    };

    /**
 * Executes operations logic for handleDeleteLayer.
 *
 * @param layerId: string
 * @returns State operations sequence.
 */
    const handleDeleteLayer = (layerId: string) => {
        updateLayers((prev) => prev.filter((l) => l.id !== layerId));
        if (selectedLayerId === layerId) setSelectedLayerId(null);
    };

    /**
 * Executes operations logic for handleLayerPropChange.
 *
 * @param property: keyof Layer, value: any
 * @returns State operations sequence.
 */
    const handleLayerPropChange = (property: keyof Layer, value: any) => {
        if (!selectedLayerId) return;
        updateLayers((prev) =>
            prev.map((l) => (l.id === selectedLayerId ? ({ ...l, [property]: value } as Layer) : l))
        );
    };

    /**
 * Executes operations logic for handleLayerMetadataChange.
 *
 * @param key: string, value: any
 * @returns State operations sequence.
 */
    const handleLayerMetadataChange = (key: string, value: any) => {
        if (!selectedLayerId) return;
        updateLayers((prev) =>
            prev.map((l) =>
                l.id === selectedLayerId
                    ? { ...l, metadata: { ...(l.metadata || {}), [key]: value } }
                    : l
            )
        );
    };

    /**
 * Executes operations logic for handleMoveLayerZIndex.
 *
 * @param direction: "up" | "down" | "top" | "bottom"
 * @returns State operations sequence.
 */
    const handleMoveLayerZIndex = (direction: "up" | "down" | "top" | "bottom") => {
        if (!selectedLayerId) return;
        const currentLayers = [...layers];
        const idx = currentLayers.findIndex((l) => l.id === selectedLayerId);
        if (idx === -1) return;

        const target = currentLayers[idx];
        currentLayers.splice(idx, 1);

        if (direction === "up") {
            currentLayers.splice(Math.min(currentLayers.length, idx + 1), 0, target);
        } else if (direction === "down") {
            currentLayers.splice(Math.max(0, idx - 1), 0, target);
        } else if (direction === "top") {
            currentLayers.push(target);
        } else if (direction === "bottom") {
            currentLayers.unshift(target);
        }

        const updated = currentLayers.map((l, i) => ({ ...l, z_index: i + 1 }));
        updateLayers(() => updated);
    };

    /**
 * Executes operations logic for getLayerRenderedText.
 *
 * @param layer: Layer
 * @returns State operations sequence.
 */
    const getLayerRenderedText = (layer: Layer) => {
        const varKey = layer.metadata?.variable_key;
        if (!varKey) return layer.text || "";
        if (varKey === "client_name") return variables.client_name;
        if (varKey === "advisor_name") return variables.advisor_name;
        if (varKey === "fund_value") return variables.fund_value;
        if (varKey === "date") return variables.date;
        return layer.text || "";
    };

    /**
 * Executes operations logic for renderLayerContent.
 *
 * @param layer: Layer
 * @returns State operations sequence.
 */
    const renderLayerContent = (layer: Layer) => {
        switch (layer.type) {
            case "text":
                return (
                    <div
                        style={{
                            fontFamily: layer.font_family || "Inter",
                            fontSize: `${layer.font_size || 16}px`,
                            color: layer.color || "#000000",
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: layer.metadata?.align || "left",
                            fontWeight: layer.metadata?.bold ? "bold" : "normal",
                            fontStyle: layer.metadata?.italic ? "italic" : "normal",
                            textDecoration: layer.metadata?.underline ? "underline" : "none",
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word"
                        }}
                    >
                        {getLayerRenderedText(layer)}
                    </div>
                );
            case "image":
                return (
                    <img
                        src={layer.image_url || "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=500"}
                        alt="Layer Graphic"
                        className={styles.div_0}
                        style={{
                            borderRadius: `${layer.metadata?.border_radius || 0}px`,
                            filter: `blur(${layer.metadata?.blur || 0}px) brightness(${layer.metadata?.brightness || 100}%)`
                        }}
                    />
                );
            case "shape":
                if (layer.shape_type === "circle") {
                    return (
                        <div
                            className={styles.div_1}
                            style={{
                                backgroundColor: layer.color || "#F4C542",
                                borderRadius: "50%",
                                border: `${layer.metadata?.stroke_width || 0}px solid ${layer.metadata?.stroke_color || "transparent"}`
                            }}
                        />
                    );
                }
                if (layer.shape_type === "triangle") {
                    return (
                        <svg className={styles.div_2} viewBox="0 0 100 100" preserveAspectRatio="none">
                            <polygon
                                points="50,0 100,100 0,100"
                                fill={layer.color || "#F4C542"}
                                stroke={layer.metadata?.stroke_color || "transparent"}
                                strokeWidth={layer.metadata?.stroke_width || 0}
                            />
                        </svg>
                    );
                }
                return (
                    <div
                        className={styles.div_3}
                        style={{
                            backgroundColor: layer.color || "#F4C542",
                            borderRadius: `${layer.metadata?.border_radius || 0}px`,
                            border: `${layer.metadata?.stroke_width || 0}px solid ${layer.metadata?.stroke_color || "transparent"}`
                        }}
                    />
                );
            case "icon":
                const IconComp = (Lucide as any)[layer.icon_name || "HelpCircle"] || Lucide.HelpCircle;
                return (
                    <div className={styles.container_4} style={{ color: layer.color || "#000000" }}>
                        <IconComp size={Math.min(layer.width, layer.height)} />
                    </div>
                );
            default:
                return null;
        }
    };

    /**
 * Executes operations logic for getHandlePositionStyle.
 *
 * @param handle: string
 * @returns State operations sequence.
 */
    const getHandlePositionStyle = (handle: string) => {
        switch (handle) {
            case "tl": return { left: 0, top: 0 };
            case "tr": return { left: "100%", top: 0 };
            case "bl": return { left: 0, top: "100%" };
            case "br": return { left: "100%", top: "100%" };
            case "t": return { left: "50%", top: 0 };
            case "b": return { left: "50%", top: "100%" };
            case "l": return { left: 0, top: "50%" };
            case "r": return { left: "100%", top: "50%" };
            default: return {};
        }
    };

    /**
 * Executes operations logic for exportToImage.
 *
 * @param format: "png" | "jpeg" | "pdf"
 * @returns State operations sequence.
 */
    const exportToImage = async (format: "png" | "jpeg" | "pdf") => {
        const canvas = document.createElement("canvas");
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.fillStyle = canvasBgColor;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        if (canvasBgImage) {
            const bgImg = new Image();
            bgImg.crossOrigin = "anonymous";
            bgImg.src = canvasBgImage;
            await new Promise((resolve) => {
                bgImg.onload = () => {
                    ctx.drawImage(bgImg, 0, 0, canvasWidth, canvasHeight);
                    resolve(null);
                };
                bgImg.onerror = () => resolve(null);
            });
        }

        const sortedLayers = [...layers]
            .filter((l) => l.visible !== false)
            .sort((a, b) => a.z_index - b.z_index);

        for (const l of sortedLayers) {
            ctx.save();
            ctx.globalAlpha = l.opacity !== undefined ? l.opacity : 1;

            const cx = l.x + l.width / 2;
            const cy = l.y + l.height / 2;
            ctx.translate(cx, cy);
            ctx.rotate(((l.rotation || 0) * Math.PI) / 180);
            ctx.translate(-cx, -cy);

            if (l.type === "text") {
                const text = getLayerRenderedText(l);
                ctx.font = `${l.metadata?.bold ? "bold " : ""}${l.metadata?.italic ? "italic " : ""}${l.font_size || 16}px ${l.font_family || "Inter"}`;
                ctx.fillStyle = l.color || "#000000";
                ctx.textBaseline = "middle";
                ctx.textAlign = l.metadata?.align || "left";

                const tx = l.metadata?.align === "center" ? l.x + l.width / 2 : l.metadata?.align === "right" ? l.x + l.width : l.x;
                ctx.fillText(text, tx, l.y + l.height / 2);
            } else if (l.type === "image") {
                const img = new Image();
                img.crossOrigin = "anonymous";
                img.src = l.image_url || "";
                await new Promise((resolve) => {
                    img.onload = () => {
                        ctx.drawImage(img, l.x, l.y, l.width, l.height);
                        resolve(null);
                    };
                    img.onerror = () => resolve(null);
                });
            } else if (l.type === "shape") {
                ctx.fillStyle = l.color || "#F4C542";
                if (l.shape_type === "circle") {
                    ctx.beginPath();
                    ctx.arc(l.x + l.width / 2, l.y + l.height / 2, Math.min(l.width, l.height) / 2, 0, 2 * Math.PI);
                    ctx.fill();
                } else if (l.shape_type === "triangle") {
                    ctx.beginPath();
                    ctx.moveTo(l.x + l.width / 2, l.y);
                    ctx.lineTo(l.x + l.width, l.y + l.height);
                    ctx.lineTo(l.x, l.y + l.height);
                    ctx.closePath();
                    ctx.fill();
                } else {
                    ctx.fillRect(l.x, l.y, l.width, l.height);
                }
            } else if (l.type === "icon") {
                ctx.fillStyle = l.color || "#000000";
                ctx.font = `${Math.min(l.width, l.height)}px sans-serif`;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText("★", l.x + l.width / 2, l.y + l.height / 2);
            }

            ctx.restore();
        }

        if (format === "pdf") {
            const imgData = canvas.toDataURL("image/png");
            const printWindow = window.open("", "_blank");
            if (printWindow) {
                printWindow.document.write(`
                    <html><head><title>Export Design</title>
                    <style>body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #fff; } img { max-width: 100%; max-height: 100%; object-fit: contain; } @page { size: auto; margin: 0mm; } @media print { body { -webkit-print-color-adjust: exact; } img { width: 100%; height: 100%; } }</style>
                    </head><body><img src="${imgData}" onload="window.print(); window.close();" /></body></html>`);
                printWindow.document.close();
            }
        } else {
            const link = document.createElement("a");
            link.download = `design_${Date.now()}.${format}`;
            link.href = canvas.toDataURL(`image/${format === "jpeg" ? "jpeg" : "png"}`);
            link.click();
        }
        setDownloadModalOpen(false);
    };

    /**
 * Executes operations logic for runAiAnalysis.
 *
 * 
 * @returns State operations sequence.
 */
    const runAiAnalysis = async () => {
        if (!aiFile) return;
        setAiAnalyzing(true);
        const steps = [
            "Uploading mockup asset to secure sandbox...",
            "Analyzing spatial geometry and color distribution...",
            "Detecting graphic vectors, borders, and shape layouts...",
            "Scanning layout typography, font heights, and optical weights...",
            "Resolving document structures into dynamic variables...",
            "Constructing Canvas Magic Layers and binding database schema..."
        ];

        for (const step of steps) {
            setAiStep(step);
            await new Promise((resolve) => setTimeout(resolve, 800));
        }

        const reconstructed: Layer[] = [
            {
                id: `ai-layer-${Date.now()}-1`,
                type: "shape",
                x: 0,
                y: 0,
                width: 800,
                height: 600,
                rotation: 0,
                opacity: 1,
                z_index: 1,
                color: "#FFF7D6",
                shape_type: "rectangle",
                visible: true,
                locked: false,
                metadata: {}
            },
            {
                id: `ai-layer-${Date.now()}-2`,
                type: "shape",
                x: 400,
                y: 0,
                width: 400,
                height: 600,
                rotation: 0,
                opacity: 1,
                z_index: 2,
                color: "#FFFFFF",
                shape_type: "rectangle",
                visible: true,
                locked: false,
                metadata: {}
            },
            {
                id: `ai-layer-${Date.now()}-3`,
                type: "text",
                x: 80,
                y: 100,
                width: 260,
                height: 120,
                rotation: 0,
                opacity: 1,
                z_index: 3,
                text: "LIVE A BRIGHTER LIFE",
                font_family: "Inter",
                font_size: 32,
                color: "#000000",
                visible: true,
                locked: false,
                metadata: { bold: true }
            },
            {
                id: `ai-layer-${Date.now()}-4`,
                type: "text",
                x: 80,
                y: 250,
                width: 260,
                height: 40,
                rotation: 0,
                opacity: 1,
                z_index: 4,
                text: "Juan Dela Cruz",
                font_family: "serif",
                font_size: 20,
                color: "#A3843B",
                visible: true,
                locked: false,
                metadata: { bold: true, variable_key: "client_name" }
            },
            {
                id: `ai-layer-${Date.now()}-5`,
                type: "text",
                x: 80,
                y: 300,
                width: 260,
                height: 40,
                rotation: 0,
                opacity: 1,
                z_index: 5,
                text: "Daniel Padua",
                font_family: "Inter",
                font_size: 16,
                color: "#000000",
                visible: true,
                locked: false,
                metadata: { variable_key: "advisor_name" }
            },
            {
                id: `ai-layer-${Date.now()}-6`,
                type: "image",
                x: 440,
                y: 80,
                width: 320,
                height: 240,
                rotation: 0,
                opacity: 1,
                z_index: 6,
                image_url: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600",
                visible: true,
                locked: false,
                metadata: { border_radius: 8 }
            },
            {
                id: `ai-layer-${Date.now()}-7`,
                type: "shape",
                x: 440,
                y: 360,
                width: 320,
                height: 160,
                rotation: 0,
                opacity: 0.95,
                z_index: 7,
                color: "#FFF9E5",
                shape_type: "rectangle",
                visible: true,
                locked: false,
                metadata: { border_radius: 8, stroke_color: "#F4C542", stroke_width: 1 }
            },
            {
                id: `ai-layer-${Date.now()}-8`,
                type: "text",
                x: 470,
                y: 390,
                width: 260,
                height: 30,
                rotation: 0,
                opacity: 1,
                z_index: 8,
                text: "YOUR SECURED SAVINGS VALUE",
                font_family: "Inter",
                font_size: 11,
                color: "#A3843B",
                visible: true,
                locked: false,
                metadata: { bold: true }
            },
            {
                id: `ai-layer-${Date.now()}-9`,
                type: "text",
                x: 470,
                y: 420,
                width: 260,
                height: 60,
                rotation: 0,
                opacity: 1,
                z_index: 9,
                text: "PHP 7,238",
                font_family: "mono",
                font_size: 36,
                color: "#000000",
                visible: true,
                locked: false,
                metadata: { bold: true, variable_key: "fund_value" }
            }
        ];

        updateLayers(() => reconstructed);
        setAiAnalyzing(false);
        setAiModalOpen(false);
        setAiFile(null);
    };

    const selectedLayer = layers.find((l) => l.id === selectedLayerId);
    const sortedLayersList = [...layers].sort((a, b) => b.z_index - a.z_index);

    const filteredIcons = stockIcons.filter((icon) =>
        icon.toLowerCase().includes(iconSearchQuery.toLowerCase())
    );

    /**
 * Executes operations logic for Modal.
 *
 * @param { open, onClose, title, children }: { open: boolean; onClose: (
 * @returns State operations sequence.
 */
    const Modal = ({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) => {
        if (!open) return null;
        return (
            <div className={styles.container_5}>
                <div className={styles.text_6}>
                    <div className={styles.container_7}>
                        <h3 className={styles.text_8}>{title}</h3>
                        <button type="button" onClick={onClose} className={styles.table_9}>
                            <Lucide.X className={styles.text_10} />
                        </button>
                    </div>
                    {children}
                </div>
            </div>
        );
    };

    return (
        <div className={styles.text_11}>
            <Sidebar />
            <div className={styles.container_12}>
                <Header />
                <main className={styles.div_13}>
                    {view === "folders" && (
                        <div className={styles.div_14}>
                            <div className={styles.container_15}>
                                <div>
                                    <h1 className={styles.text_16}>Branding Studio</h1>
                                    <p className={styles.table_17}>
                                        Organize assets and design high-fidelity marketing canvas baselines
                                    </p>
                                </div>
                                <div className={styles.container_18}>
                                    <span className={styles.table_19}>
                                        Schema: {dbMode.replace("_", " ")}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setFolderModalOpen(true)}
                                        className={styles.table_20}
                                    >
                                        <Lucide.FolderPlus size={14} /> Create Folder
                                    </button>
                                </div>
                            </div>

                            {loading ? (
                                <div className={styles.container_21}>
                                    <Lucide.Loader2 size={32} className={styles.text_22} />
                                </div>
                            ) : (
                                <div className={styles.container_23}>
                                    {folders.map((f) => (
                                        <div
                                            key={f.id}
                                            onClick={() => {
                                                setSelectedFolder(f);
                                                fetchTemplates(f.id);
                                                setView("templates");
                                            }}
                                            className={`${styles.table_24} group relative`}
                                        >
                                            <div className={`${styles.table_25} group`} />
                                            <button
                                                type="button"
                                                onClick={(e) => handleDeleteFolder(f, e)}
                                                disabled={deletingFolderId === f.id}
                                                className="absolute top-3 right-3 z-10 p-1.5 rounded-md bg-white/90 text-zinc-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-100 disabled:cursor-not-allowed"
                                                title="Delete folder"
                                            >
                                                {deletingFolderId === f.id ? (
                                                    <Lucide.Loader2 size={14} className="animate-spin" />
                                                ) : (
                                                    <Lucide.Trash2 size={14} />
                                                )}
                                            </button>
                                            <div className={styles.div_26}>
                                                <div className={`${styles.table_27} group`}>
                                                    <Lucide.Folder size={18} />
                                                </div>
                                                <h3 className={styles.table_28}>{f.name}</h3>
                                            </div>
                                            <span className={`${styles.table_29} group`}>
                                                Open Directory →
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {view === "templates" && selectedFolder && (
                        <div className={styles.div_30}>
                            <div className={styles.container_31}>
                                <div>
                                    <div className={styles.table_32}>
                                        <span className={styles.text_33} onClick={() => { setSelectedFolder(null); setView("folders"); }}>
                                            Studio
                                        </span>
                                        <span>/</span>
                                        <span className={styles.text_34}>{selectedFolder.name}</span>
                                    </div>
                                    <h1 className={styles.text_35}>Branding Presets</h1>
                                    <p className={styles.table_36}>
                                        Select graphic baselines to customize layouts and variables
                                    </p>
                                </div>
                                <div className={styles.container_37}>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedFolder(null);
                                            setView("folders");
                                        }}
                                        className={styles.table_38}
                                    >
                                        Back to Studio
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setTemplateModalOpen(true)}
                                        className={styles.table_39}
                                    >
                                        <Lucide.PlusCircle size={14} /> New Template
                                    </button>
                                </div>
                            </div>

                            {loading ? (
                                <div className={styles.container_40}>
                                    <Lucide.Loader2 size={32} className={styles.text_41} />
                                </div>
                            ) : (
                                <div className={styles.container_42}>
                                    {templates.length === 0 && (
                                        <div className={styles.text_43}>
                                            No baseline presets allocated in folder. Create one above to begin.
                                        </div>
                                    )}
                                    {templates.map((t) => (
                                        <div key={t.id} className={`${styles.table_44} group relative`}>
                                            <div className={`${styles.table_45} group`} />
                                            <button
                                                type="button"
                                                onClick={(e) => handleDeleteTemplate(t, e)}
                                                disabled={deletingTemplateId === t.id}
                                                className="absolute top-3 right-3 z-10 p-1.5 rounded-md bg-white/90 text-zinc-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-100 disabled:cursor-not-allowed"
                                                title="Delete template"
                                            >
                                                {deletingTemplateId === t.id ? (
                                                    <Lucide.Loader2 size={14} className="animate-spin" />
                                                ) : (
                                                    <Lucide.Trash2 size={14} />
                                                )}
                                            </button>
                                            <div className={styles.div_46}>
                                                <div className={styles.text_47}>
                                                    <Lucide.FileImage size={18} />
                                                </div>
                                                <h3 className={styles.table_48}>{t.name}</h3>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleOpenTemplate(t)}
                                                className={styles.table_49}
                                            >
                                                Open Magic Editor
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {view === "editor" && selectedTemplate && (
                        <div className={styles.div_50}>
                            <div className={styles.container_51}>
                                <div>
                                    <div className={styles.table_52}>
                                        <span className={styles.text_53} onClick={() => setView("templates")}>
                                            {selectedFolder?.name}
                                        </span>
                                        <span>/</span>
                                        <span className={styles.text_54}>{selectedTemplate.name}</span>
                                    </div>
                                    <div className={styles.container_55}>
                                        <input
                                            type="text"
                                            value={selectedTemplate.name}
                                            onChange={(e) => setSelectedTemplate({ ...selectedTemplate, name: e.target.value })}
                                            className={styles.table_56}
                                        />
                                        <span className={`${styles.table_248} ${saveStatus === "Saved"
                                            ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-800/30"
                                            : saveStatus === "Saving..."
                                                ? "bg-[#FFF7D6] dark:bg-[#2E2818]/40 text-amber-700 dark:text-amber-400 border-amber-200/50 dark:border-amber-800/30 animate-pulse"
                                                : "bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border-red-200/50 dark:border-red-800/30"
                                            } group`}>
                                            {saveStatus}
                                        </span>
                                    </div>
                                </div>

                                <div className={styles.container_57}>
                                    <button
                                        type="button"
                                        onClick={handleUndo}
                                        disabled={historyIndex <= 0}
                                        className={styles.table_58}
                                    >
                                        <Lucide.Undo2 size={14} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleRedo}
                                        disabled={historyIndex >= history.length - 1}
                                        className={styles.table_59}
                                    >
                                        <Lucide.Redo2 size={14} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setAiModalOpen(true)}
                                        className={styles.table_60}
                                    >
                                        <Lucide.Sparkles size={14} className={styles.text_61} /> AI Magic Layers
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setDownloadModalOpen(true)}
                                        className={styles.table_62}
                                    >
                                        <Lucide.Download size={14} /> Export
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleAutosave}
                                        className={styles.table_63}
                                    >
                                        <Lucide.Save size={14} /> Save Design
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setView("templates")}
                                        className={styles.table_64}
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>

                            <div className={styles.container_65}>
                                <div className={styles.container_66}>
                                    <div className={styles.container_67}>
                                        {(["templates", "text", "shapes", "uploads", "photos", "icons", "layers"] as const).map((tab) => (
                                            <button
                                                key={tab}
                                                type="button"
                                                onClick={() => setActiveSidebarTab(tab)}
                                                className={`${styles.table_249} ${activeSidebarTab === tab
                                                    ? "border-[#F4C542] text-zinc-800 dark:text-zinc-100 bg-[#FFFFFF] dark:bg-[#1E1E24]"
                                                    : "border-transparent text-zinc-400 dark:text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
                                                    } group`}
                                            >
                                                {tab.slice(0, 4)}
                                            </button>
                                        ))}
                                    </div>

                                    <div className={styles.container_68}>
                                        {activeSidebarTab === "templates" && (
                                            <div className={styles.div_69}>
                                                <h4 className={styles.table_70}>Canvas Setup</h4>
                                                <div className={styles.div_71}>
                                                    <div className={styles.div_72}>
                                                        <label className={styles.table_73}>Background Color</label>
                                                        <div className={styles.container_74}>
                                                            <input
                                                                type="color"
                                                                value={canvasBgColor}
                                                                onChange={(e) => setCanvasBgColor(e.target.value)}
                                                                className={styles.card_75}
                                                            />
                                                            <input
                                                                type="text"
                                                                value={canvasBgColor}
                                                                onChange={(e) => setCanvasBgColor(e.target.value)}
                                                                className={styles.card_76}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className={styles.div_77}>
                                                        <label className={styles.table_78}>Background Image URL</label>
                                                        <input
                                                            type="text"
                                                            value={canvasBgImage}
                                                            onChange={(e) => setCanvasBgImage(e.target.value)}
                                                            placeholder="Enter image URL..."
                                                            className={styles.card_79}
                                                        />
                                                    </div>
                                                </div>

                                                <h4 className={styles.table_80}>Variable Allocations</h4>
                                                <div className={styles.div_81}>
                                                    {[
                                                        { label: "Client Name", key: "client_name" },
                                                        { label: "Advisor Name", key: "advisor_name" },
                                                        { label: "Fund Value", key: "fund_value" },
                                                        { label: "Report Date", key: "date" }
                                                    ].map((v) => (
                                                        <div key={v.key} className={styles.div_82}>
                                                            <label className={styles.table_83}>{v.label}</label>
                                                            <input
                                                                type="text"
                                                                value={(variables as any)[v.key]}
                                                                onChange={(e) => setVariables({ ...variables, [v.key]: e.target.value })}
                                                                className={styles.card_84}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {activeSidebarTab === "text" && (
                                            <div className={styles.div_85}>
                                                <h4 className={styles.table_86}>Typography Presets</h4>
                                                <button
                                                    type="button"
                                                    onClick={() => handleAddTextLayer("heading")}
                                                    className={styles.table_87}
                                                >
                                                    <span className={styles.text_88}>Add a Heading</span>
                                                    <span className={styles.table_89}>36px bold heading</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleAddTextLayer("subheading")}
                                                    className={styles.table_90}
                                                >
                                                    <span className={styles.text_91}>Add a Subheading</span>
                                                    <span className={styles.table_92}>20px medium subtitle</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleAddTextLayer("body")}
                                                    className={styles.table_93}
                                                >
                                                    <span className={styles.text_94}>Add body text here</span>
                                                    <span className={styles.table_95}>14px regular paragraph</span>
                                                </button>
                                            </div>
                                        )}

                                        {activeSidebarTab === "shapes" && (
                                            <div className={styles.div_96}>
                                                <h4 className={styles.table_97}>Vector Elements</h4>
                                                <div className={styles.container_98}>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleAddShapeLayer("rectangle")}
                                                        className={styles.table_99}
                                                    >
                                                        <div className={styles.div_100} />
                                                        <span className={styles.table_101}>Rectangle</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleAddShapeLayer("circle")}
                                                        className={styles.table_102}
                                                    >
                                                        <div className={styles.div_103} />
                                                        <span className={styles.table_104}>Circle</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleAddShapeLayer("triangle")}
                                                        className={styles.table_105}
                                                    >
                                                        <div className={styles.table_106} />
                                                        <span className={styles.table_107}>Triangle</span>
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {activeSidebarTab === "uploads" && (
                                            <div className={styles.div_108}>
                                                <h4 className={styles.table_109}>Import Elements</h4>
                                                <div className={styles.text_110}>
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={async (e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) {
                                                                const fileExt = file.name.split(".").pop();
                                                                const fileName = `${Math.random()}.${fileExt}`;
                                                                const filePath = `uploads/${fileName}`;
                                                                const { error: uploadError } = await supabase.storage.from("design_assets").upload(filePath, file, { cacheControl: "3600", upsert: true });
                                                                if (uploadError) {
                                                                    const reader = new FileReader();
                                                                    reader.onload = () => {
                                                                        if (typeof reader.result === "string") {
                                                                            handleAddImageLayer(reader.result);
                                                                        }
                                                                    };
                                                                    reader.readAsDataURL(file);
                                                                } else {
                                                                    const { data: { publicUrl } } = supabase.storage.from("design_assets").getPublicUrl(filePath);
                                                                    handleAddImageLayer(publicUrl);
                                                                }
                                                            }
                                                        }}
                                                        className={styles.card_111}
                                                    />
                                                </div>
                                                <div className={styles.div_112}>
                                                    <label className={styles.table_113}>Or Paste Public Image URL</label>
                                                    <input
                                                        type="text"
                                                        placeholder="Enter image URL..."
                                                        onKeyDown={(e) => {
                                                            if (e.key === "Enter" && e.currentTarget.value.trim()) {
                                                                handleAddImageLayer(e.currentTarget.value.trim());
                                                                e.currentTarget.value = "";
                                                            }
                                                        }}
                                                        className={styles.card_114}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {activeSidebarTab === "photos" && (
                                            <div className={styles.div_115}>
                                                <h4 className={styles.table_116}>Premium Stock Library</h4>
                                                <div className={styles.container_117}>
                                                    {stockPhotos.map((url, i) => (
                                                        <div
                                                            key={i}
                                                            onClick={() => handleAddImageLayer(url)}
                                                            className={styles.table_118}
                                                        >
                                                            <img src={url} alt="Stock asset" className={styles.div_119} />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {activeSidebarTab === "icons" && (
                                            <div className={styles.div_120}>
                                                <h4 className={styles.table_121}>Vector Icons</h4>
                                                <input
                                                    type="text"
                                                    placeholder="Search icons..."
                                                    value={iconSearchQuery}
                                                    onChange={(e) => setIconSearchQuery(e.target.value)}
                                                    className={styles.card_122}
                                                />
                                                <div className={styles.container_123}>
                                                    {filteredIcons.map((iconName) => {
                                                        const IconComponent = (Lucide as any)[iconName];
                                                        if (!IconComponent) return null;
                                                        return (
                                                            <button
                                                                key={iconName}
                                                                type="button"
                                                                onClick={() => handleAddIconLayer(iconName)}
                                                                className={styles.table_124}
                                                                title={iconName}
                                                            >
                                                                <IconComponent size={16} />
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {activeSidebarTab === "layers" && (
                                            <div className={styles.div_125}>
                                                <h4 className={styles.table_126}>Layers Matrix</h4>
                                                {layers.length === 0 && (
                                                    <p className={styles.text_127}>No layers present in design</p>
                                                )}
                                                <div className={styles.div_128}>
                                                    {sortedLayersList.map((l) => (
                                                        <div
                                                            key={l.id}
                                                            onClick={() => setSelectedLayerId(l.id)}
                                                            className={`${styles.table_250} ${selectedLayerId === l.id
                                                                ? "bg-[#FFF9E5] border-[#F4C542] font-bold"
                                                                : "bg-card border-[#E5E7EB] hover:bg-[#FFF9E5]/30"
                                                                } group`}
                                                        >
                                                            <div className={styles.container_129}>
                                                                <span className={styles.text_130}>
                                                                    {l.type}
                                                                </span>
                                                                <span className={styles.table_131}>
                                                                    {l.type === "text" ? getLayerRenderedText(l) : l.shape_type || l.icon_name || "Image Element"}
                                                                </span>
                                                            </div>
                                                            <div className={styles.container_132}>
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => { e.stopPropagation(); setSelectedLayerId(l.id); handleLayerPropChange("visible", l.visible === false); }}
                                                                    className={styles.text_133}
                                                                >
                                                                    {l.visible === false ? <Lucide.EyeOff size={11} /> : <Lucide.Eye size={11} />}
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => { e.stopPropagation(); setSelectedLayerId(l.id); handleLayerPropChange("locked", !l.locked); }}
                                                                    className={styles.text_134}
                                                                >
                                                                    {l.locked ? <Lucide.Lock size={11} className={styles.text_135} /> : <Lucide.Unlock size={11} />}
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => { e.stopPropagation(); handleDeleteLayer(l.id); }}
                                                                    className={styles.text_136}
                                                                >
                                                                    <Lucide.Trash2 size={11} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className={styles.container_137}>
                                    <div className={styles.table_138}>
                                        <span>Canvas Workspace</span>
                                        <div className={styles.container_139}>
                                            <span>Zoom: {zoom}%</span>
                                            <input
                                                type="range"
                                                min="50"
                                                max="150"
                                                value={zoom}
                                                onChange={(e) => setZoom(Number(e.target.value))}
                                                className={styles.div_140}
                                            />
                                        </div>
                                    </div>

                                    <div className={styles.table_141}>
                                        <div
                                            ref={canvasContainerRef}
                                            onClick={() => setSelectedLayerId(null)}
                                            className={styles.card_142}
                                            style={{
                                                width: `${canvasWidth}px`,
                                                height: `${canvasHeight}px`,
                                                transform: `scale(${zoom / 100})`,
                                                transformOrigin: "center center",
                                                backgroundColor: canvasBgColor,
                                                backgroundImage: canvasBgImage ? `url(${canvasBgImage})` : "none",
                                                backgroundSize: "cover",
                                                backgroundPosition: "center"
                                            }}
                                        >
                                            {layers.filter((l) => l.visible !== false).map((layer) => {
                                                return (
                                                    <div
                                                        key={layer.id}
                                                        id={`layer-${layer.id}`}
                                                        onPointerDown={(e) => handlePointerDown(e, layer.id, "dragging")}
                                                        className={`${styles.container_251} ${layer.locked ? "" : "cursor-move"} ${selectedLayerId === layer.id ? "ring-1 ring-[#F4C542]" : "hover:ring-1 hover:ring-gray-300"
                                                            } group`}
                                                        style={{
                                                            left: `${layer.x}px`,
                                                            top: `${layer.y}px`,
                                                            width: `${layer.width}px`,
                                                            height: `${layer.height}px`,
                                                            transform: `rotate(${layer.rotation || 0}deg)`,
                                                            transformOrigin: "center center",
                                                            zIndex: layer.z_index,
                                                            opacity: layer.opacity !== undefined ? layer.opacity : 1
                                                        }}
                                                    >
                                                        {renderLayerContent(layer)}
                                                    </div>
                                                );
                                            })}

                                            {selectedLayer && !selectedLayer.locked && (
                                                <div
                                                    className={styles.div_143}
                                                    style={{
                                                        left: `${selectedLayer.x}px`,
                                                        top: `${selectedLayer.y}px`,
                                                        width: `${selectedLayer.width}px`,
                                                        height: `${selectedLayer.height}px`,
                                                        transform: `rotate(${selectedLayer.rotation || 0}deg)`,
                                                        transformOrigin: "center center"
                                                    }}
                                                >
                                                    {["tl", "tr", "bl", "br", "t", "b", "l", "r"].map((handle) => {
                                                        const pos = getHandlePositionStyle(handle);
                                                        return (
                                                            <div
                                                                key={handle}
                                                                className={styles.card_144}
                                                                style={{
                                                                    ...pos,
                                                                    transform: "translate(-50%, -50%)"
                                                                }}
                                                                onPointerDown={(e) => handlePointerDown(e, selectedLayer.id, "resizing", handle)}
                                                            />
                                                        );
                                                    })}

                                                    <div
                                                        className={styles.card_145}
                                                        style={{
                                                            left: "50%",
                                                            bottom: "-25px",
                                                            transform: "translateX(-50%)"
                                                        }}
                                                        onPointerDown={(e) => handlePointerDown(e, selectedLayer.id, "rotating")}
                                                    >
                                                        <Lucide.RefreshCw size={10} className={styles.text_146} />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <p className={styles.table_147}>
                                        Drag layers to move • Drag handles to resize • Drag bottom wheel to rotate
                                    </p>
                                </div>

                                <div className={styles.card_148}>
                                    <div className={styles.div_149}>
                                        <h3 className={styles.table_150}>
                                            Properties Desk
                                        </h3>

                                        {selectedLayer ? (
                                            <div className={styles.text_151}>
                                                <div className={styles.container_152}>
                                                    <div>
                                                        <label className={styles.table_153}>Width</label>
                                                        <input
                                                            type="number"
                                                            value={selectedLayer.width}
                                                            onChange={(e) => handleLayerPropChange("width", Math.max(1, Number(e.target.value)))}
                                                            className={styles.card_154}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className={styles.table_155}>Height</label>
                                                        <input
                                                            type="number"
                                                            value={selectedLayer.height}
                                                            onChange={(e) => handleLayerPropChange("height", Math.max(1, Number(e.target.value)))}
                                                            className={styles.card_156}
                                                        />
                                                    </div>
                                                    <div className={styles.div_157}>
                                                        <label className={styles.table_158}>X Position</label>
                                                        <input
                                                            type="number"
                                                            value={selectedLayer.x}
                                                            onChange={(e) => handleLayerPropChange("x", Number(e.target.value))}
                                                            className={styles.card_159}
                                                        />
                                                    </div>
                                                    <div className={styles.div_160}>
                                                        <label className={styles.table_161}>Y Position</label>
                                                        <input
                                                            type="number"
                                                            value={selectedLayer.y}
                                                            onChange={(e) => handleLayerPropChange("y", Number(e.target.value))}
                                                            className={styles.card_162}
                                                        />
                                                    </div>
                                                </div>

                                                <div className={styles.div_163}>
                                                    <div className={styles.container_164}>
                                                        <label className={styles.table_165}>Opacity</label>
                                                        <span className={styles.text_166}>{Math.round(selectedLayer.opacity * 100)}%</span>
                                                    </div>
                                                    <input
                                                        type="range"
                                                        min="0"
                                                        max="1"
                                                        step="0.05"
                                                        value={selectedLayer.opacity}
                                                        onChange={(e) => handleLayerPropChange("opacity", Number(e.target.value))}
                                                        className={styles.div_167}
                                                    />
                                                </div>

                                                <div className={styles.div_168}>
                                                    <label className={styles.table_169}>Z-Order (Z-Index)</label>
                                                    <div className={styles.container_170}>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleMoveLayerZIndex("top")}
                                                            className={styles.text_171}
                                                        >
                                                            Top
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleMoveLayerZIndex("up")}
                                                            className={styles.text_172}
                                                        >
                                                            Up
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleMoveLayerZIndex("down")}
                                                            className={styles.text_173}
                                                        >
                                                            Down
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleMoveLayerZIndex("bottom")}
                                                            className={styles.text_174}
                                                        >
                                                            Bottom
                                                        </button>
                                                    </div>
                                                </div>

                                                {selectedLayer.type === "text" && (
                                                    <div className={styles.div_175}>
                                                        <div className={styles.div_176}>
                                                            <label className={styles.table_177}>Layer Text</label>
                                                            <textarea
                                                                value={selectedLayer.text || ""}
                                                                onChange={(e) => handleLayerPropChange("text", e.target.value)}
                                                                className={styles.card_178}
                                                                rows={2}
                                                            />
                                                        </div>

                                                        <div className={styles.container_179}>
                                                            <div>
                                                                <label className={styles.table_180}>Font Size</label>
                                                                <input
                                                                    type="number"
                                                                    value={selectedLayer.font_size}
                                                                    onChange={(e) => handleLayerPropChange("font_size", Math.max(1, Number(e.target.value)))}
                                                                    className={styles.card_181}
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className={styles.table_182}>Font Color</label>
                                                                <div className={styles.container_183}>
                                                                    <input
                                                                        type="color"
                                                                        value={selectedLayer.color || "#000000"}
                                                                        onChange={(e) => handleLayerPropChange("color", e.target.value)}
                                                                        className={styles.card_184}
                                                                    />
                                                                    <input
                                                                        type="text"
                                                                        value={selectedLayer.color || "#000000"}
                                                                        onChange={(e) => handleLayerPropChange("color", e.target.value)}
                                                                        className={styles.card_185}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className={styles.div_186}>
                                                            <label className={styles.table_187}>Font Family</label>
                                                            <select
                                                                value={selectedLayer.font_family || "Inter"}
                                                                onChange={(e) => handleLayerPropChange("font_family", e.target.value)}
                                                                className={styles.card_188}
                                                            >
                                                                <option value="Inter">Inter (Sans)</option>
                                                                <option value="serif">Times (Serif)</option>
                                                                <option value="mono">Courier (Mono)</option>
                                                            </select>
                                                        </div>

                                                        <div className={styles.div_189}>
                                                            <label className={styles.table_190}>Link to Database Variable</label>
                                                            <select
                                                                value={selectedLayer.metadata?.variable_key || ""}
                                                                onChange={(e) => handleLayerMetadataChange("variable_key", e.target.value || null)}
                                                                className={styles.card_191}
                                                            >
                                                                <option value="">None (Static Text)</option>
                                                                <option value="client_name">Client Name</option>
                                                                <option value="advisor_name">Advisor Name</option>
                                                                <option value="fund_value">Fund Value</option>
                                                                <option value="date">Date</option>
                                                            </select>
                                                        </div>

                                                        <div className={styles.container_192}>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleLayerMetadataChange("bold", !selectedLayer.metadata?.bold)}
                                                                className={`${styles.text_252} ${selectedLayer.metadata?.bold ? "bg-[#FFF9E5] text-black" : "bg-card hover:bg-muted text-muted-foreground"
                                                                    }`}
                                                            >
                                                                B
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleLayerMetadataChange("italic", !selectedLayer.metadata?.italic)}
                                                                className={`${styles.text_253} ${selectedLayer.metadata?.italic ? "bg-[#FFF9E5] text-black" : "bg-card hover:bg-muted text-muted-foreground"
                                                                    }`}
                                                            >
                                                                I
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleLayerMetadataChange("underline", !selectedLayer.metadata?.underline)}
                                                                className={`${styles.text_254} ${selectedLayer.metadata?.underline ? "bg-[#FFF9E5] text-black" : "bg-card hover:bg-muted text-muted-foreground"
                                                                    }`}
                                                            >
                                                                U
                                                            </button>
                                                        </div>

                                                        <div className={styles.container_193}>
                                                            {(["left", "center", "right"] as const).map((align) => (
                                                                <button
                                                                    key={align}
                                                                    type="button"
                                                                    onClick={() => handleLayerMetadataChange("align", align)}
                                                                    className={`${styles.text_255} ${(selectedLayer.metadata?.align || "left") === align
                                                                        ? "bg-[#FFF9E5] text-black"
                                                                        : "bg-card hover:bg-muted text-muted-foreground"
                                                                        }`}
                                                                >
                                                                    {align}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {selectedLayer.type === "shape" && (
                                                    <div className={styles.div_194}>
                                                        <div className={styles.div_195}>
                                                            <label className={styles.table_196}>Fill Color</label>
                                                            <div className={styles.container_197}>
                                                                <input
                                                                    type="color"
                                                                    value={selectedLayer.color || "#F4C542"}
                                                                    onChange={(e) => handleLayerPropChange("color", e.target.value)}
                                                                    className={styles.card_198}
                                                                />
                                                                <input
                                                                    type="text"
                                                                    value={selectedLayer.color || "#F4C542"}
                                                                    onChange={(e) => handleLayerPropChange("color", e.target.value)}
                                                                    className={styles.card_199}
                                                                />
                                                            </div>
                                                        </div>

                                                        {selectedLayer.shape_type === "rectangle" && (
                                                            <div>
                                                                <label className={styles.table_200}>Corner Radius</label>
                                                                <input
                                                                    type="range"
                                                                    min="0"
                                                                    max="100"
                                                                    value={selectedLayer.metadata?.border_radius || 0}
                                                                    onChange={(e) => handleLayerMetadataChange("border_radius", Number(e.target.value))}
                                                                    className={styles.div_201}
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {selectedLayer.type === "image" && (
                                                    <div className={styles.div_202}>
                                                        <div className={styles.div_203}>
                                                            <label className={styles.table_204}>Asset Source URL</label>
                                                            <input
                                                                type="text"
                                                                value={selectedLayer.image_url || ""}
                                                                onChange={(e) => handleLayerPropChange("image_url", e.target.value)}
                                                                className={styles.card_205}
                                                            />
                                                        </div>

                                                        <div>
                                                            <label className={styles.table_206}>Border Radius</label>
                                                            <input
                                                                type="range"
                                                                min="0"
                                                                max="100"
                                                                value={selectedLayer.metadata?.border_radius || 0}
                                                                onChange={(e) => handleLayerMetadataChange("border_radius", Number(e.target.value))}
                                                                className={styles.div_207}
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                {selectedLayer.type === "icon" && (
                                                    <div className={styles.div_208}>
                                                        <div className={styles.div_209}>
                                                            <label className={styles.table_210}>Vector Color</label>
                                                            <div className={styles.container_211}>
                                                                <input
                                                                    type="color"
                                                                    value={selectedLayer.color || "#000000"}
                                                                    onChange={(e) => handleLayerPropChange("color", e.target.value)}
                                                                    className={styles.card_212}
                                                                />
                                                                <input
                                                                    type="text"
                                                                    value={selectedLayer.color || "#000000"}
                                                                    onChange={(e) => handleLayerPropChange("color", e.target.value)}
                                                                    className={styles.card_213}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className={styles.text_214}>
                                                Select canvas element to customize boundaries
                                            </div>
                                        )}
                                    </div>

                                    {selectedLayer && (
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteLayer(selectedLayer.id)}
                                            className={styles.table_215}
                                        >
                                            <Lucide.Trash2 size={13} /> Delete Active Layer
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            <Modal open={folderModalOpen} onClose={() => setFolderModalOpen(false)} title="Create Design Folder">
                <div className={styles.div_216}>
                    <div className={styles.div_217}>
                        <label className={styles.table_218}>Folder Name</label>
                        <input
                            type="text"
                            placeholder="Enter folder name..."
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            className={styles.card_219}
                        />
                    </div>
                    <button
                        type="button"
                        onClick={handleCreateFolder}
                        className={styles.table_220}
                    >
                        Create Folder
                    </button>
                </div>
            </Modal>

            <Modal open={templateModalOpen} onClose={() => setTemplateModalOpen(false)} title="Add Design Preset Template">
                <div className={styles.div_221}>
                    <div className={styles.div_222}>
                        <label className={styles.table_223}>Template Title</label>
                        <input
                            type="text"
                            placeholder="Enter template name..."
                            value={newTemplateName}
                            onChange={(e) => setNewTemplateName(e.target.value)}
                            className={styles.card_224}
                        />
                    </div>
                    <div className={styles.div_225}>
                        <label className={styles.table_226}>Background Image URL</label>
                        <input
                            type="text"
                            placeholder="Enter background image URL..."
                            value={newTemplateBgUrl}
                            onChange={(e) => setNewTemplateBgUrl(e.target.value)}
                            className={styles.card_227}
                        />
                    </div>
                    <div className={styles.text_228}>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setNewTemplateFile(e.target.files?.[0] || null)}
                            className={styles.card_229}
                        />
                        {newTemplateFile && <p className={styles.text_230}>✓ {newTemplateFile.name} selected</p>}
                    </div>
                    <button
                        type="button"
                        onClick={handleCreateTemplate}
                        disabled={saving}
                        className={styles.table_231}
                    >
                        {saving ? <Lucide.Loader2 size={14} className={styles.div_232} /> : "Save Preset Template"}
                    </button>
                </div>
            </Modal>

            <Modal open={downloadModalOpen} onClose={() => setDownloadModalOpen(false)} title="Export Canvas Output">
                <div className={styles.div_233}>
                    <div className={styles.div_234}>
                        <label className={styles.table_235}>Select Export Format</label>
                        <select
                            value={downloadFormat}
                            onChange={(e) => setDownloadFormat(e.target.value as any)}
                            className={styles.card_236}
                        >
                            <option value="png">PNG High Quality Image</option>
                            <option value="jpeg">JPG Standard Quality Image</option>
                            <option value="pdf">PDF Ready to Print</option>
                        </select>
                    </div>
                    <button
                        type="button"
                        onClick={() => exportToImage(downloadFormat)}
                        className={styles.table_237}
                    >
                        Trigger Asset Download
                    </button>
                </div>
            </Modal>

            <Modal open={aiModalOpen} onClose={() => setAiModalOpen(false)} title="AI Magic Layers Reconstruction">
                <div className={styles.div_238}>
                    <p className={styles.text_239}>
                        Upload any static poster image. The AI Vision scanner will analyze the composition, detect text layers, variables, and shapes, and automatically reconstruct it as a fully editable design.
                    </p>
                    <div className={styles.text_240}>
                        <input
                            type="file"
                            accept="image/*"
                            disabled={aiAnalyzing}
                            onChange={(e) => setAiFile(e.target.files?.[0] || null)}
                            className={styles.card_241}
                        />
                        {aiFile && <p className={styles.text_242}>✓ {aiFile.name} ready for AI Vision scan</p>}
                    </div>
                    {aiAnalyzing ? (
                        <div className={styles.text_243}>
                            <Lucide.Loader2 size={24} className={styles.text_244} />
                            <p className={styles.table_245}>{aiStep}</p>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={runAiAnalysis}
                            disabled={!aiFile}
                            className={styles.table_246}
                        >
                            <Lucide.Sparkles size={14} className={styles.text_247} /> Reconstruct Bounding Layers
                        </button>
                    )}
                </div>
            </Modal>
        </div>
    );
}