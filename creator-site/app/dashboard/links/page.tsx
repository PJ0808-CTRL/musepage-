"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";

import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";

type BlockType =
  | "link"
  | "heading"
  | "text"
  | "divider"
  | "quote"
  | "image"
  | "video"
  | "spotify"
  | "countdown"
  | "cta"
  | "email"
  | "contact";

type LinkItem = {
  id: string;
  site_id: string;
  title: string;
  url: string;
  active: boolean;
  position: number;
  featured: boolean | null;
  schedule_start: string | null;
  schedule_end: string | null;
  type: BlockType;
  image_url: string | null;
  description: string | null;
  embed_url: string | null;
  email: string | null;
  open_new_tab: boolean | null;
};

const BLOCK_TYPES: {
  value: BlockType;
  label: string;
  icon: string;
  description: string;
}[] = [
  {
    value: "link",
    label: "Link",
    icon: "🔗",
    description: "A normal clickable button",
  },
  {
    value: "heading",
    label: "Heading",
    icon: "📝",
    description: "Create a section heading",
  },
  {
    value: "image",
    label: "Image",
    icon: "🖼️",
    description: "Upload an image from your device",
  },
  {
    value: "video",
    label: "YouTube Video",
    icon: "🎥",
    description: "Embed a YouTube video",
  },
  {
    value: "text",
    label: "Text",
    icon: "📄",
    description: "Add a paragraph or announcement",
  },
  {
    value: "divider",
    label: "Divider",
    icon: "➖",
    description: "Separate sections visually",
  },
  {
    value: "quote",
    label: "Quote",
    icon: "💬",
    description: "Add a quote or testimonial",
  },
  {
    value: "spotify",
    label: "Spotify",
    icon: "🎵",
    description: "Embed Spotify content",
  },
  {
    value: "countdown",
    label: "Countdown",
    icon: "⏳",
    description: "Countdown to a launch or event",
  },
  {
    value: "cta",
    label: "CTA Card",
    icon: "🚀",
    description: "Promote one important action",
  },
  {
    value: "email",
    label: "Email",
    icon: "📧",
    description: "Create an email button",
  },
  {
    value: "contact",
    label: "Contact",
    icon: "✉️",
    description: "A richer contact card",
  },
];

function getYoutubeEmbedUrl(value: string) {
  try {
    const parsed = new URL(value.trim());
    const hostname = parsed.hostname.toLowerCase();

    if (hostname === "youtu.be") {
      const id = parsed.pathname.replace("/", "").trim();
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    if (
      hostname === "youtube.com" ||
      hostname === "www.youtube.com" ||
      hostname === "m.youtube.com"
    ) {
      if (parsed.pathname === "/watch") {
        const id = parsed.searchParams.get("v");
        return id ? `https://www.youtube.com/embed/${id}` : null;
      }

      if (parsed.pathname.startsWith("/shorts/")) {
        const id = parsed.pathname.split("/shorts/")[1]?.split("/")[0];
        return id ? `https://www.youtube.com/embed/${id}` : null;
      }

      if (parsed.pathname.startsWith("/embed/")) {
        const id = parsed.pathname.split("/embed/")[1]?.split("/")[0];
        return id ? `https://www.youtube.com/embed/${id}` : null;
      }
    }
  } catch {
    return null;
  }

  return null;
}

function getSpotifyEmbedUrl(value: string) {
  try {
    const parsed = new URL(value.trim());
    const hostname = parsed.hostname.toLowerCase();

    if (
      hostname !== "open.spotify.com" &&
      hostname !== "www.open.spotify.com"
    ) {
      return null;
    }

    const parts = parsed.pathname.split("/").filter(Boolean);

    if (parts[0] === "embed") {
      return `https://open.spotify.com/${parts.join("/")}`;
    }

    const allowed = ["track", "album", "playlist", "episode", "show", "artist"];

    if (!allowed.includes(parts[0]) || !parts[1]) {
      return null;
    }

    return `https://open.spotify.com/embed/${parts[0]}/${parts[1]}`;
  } catch {
    return null;
  }
}

function normalizeUrl(value: string) {
  const trimmed = value.trim();

  if (!trimmed) return "";

  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("mailto:")
  ) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

function toDateTimeLocal(value: string) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);
  return localDate.toISOString().slice(0, 16);
}

function SortableBlock({
  block,
  onToggle,
  onEdit,
  onDelete,
  onFeature,
}: {
  block: LinkItem;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onFeature: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const typeInfo =
    BLOCK_TYPES.find((item) => item.value === block.type) || BLOCK_TYPES[0];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex flex-col gap-4 rounded-2xl border p-4 transition sm:flex-row sm:p-5 ${
        block.active
          ? "border-white/10 bg-white/[0.03]"
          : "border-white/5 bg-white/[0.01] opacity-50"
      } ${
        block.featured
          ? "border-violet-500/40 bg-violet-500/[0.05]"
          : ""
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        type="button"
        className="h-fit cursor-grab touch-none rounded-lg px-2 py-2 text-gray-500 hover:bg-white/5 hover:text-white active:cursor-grabbing"
        title="Drag to reorder"
      >
        ⋮⋮
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-lg bg-white/5 px-2 py-1 text-xs">
            {typeInfo.icon} {typeInfo.label}
          </span>

          <h3 className="truncate font-semibold">
            {block.title || typeInfo.label}
          </h3>

          {block.featured && (
            <span className="rounded-full bg-violet-500/15 px-2 py-1 text-xs text-violet-400">
              ⭐ Featured
            </span>
          )}

          {!block.active && (
            <span className="rounded-full bg-gray-500/10 px-2 py-1 text-xs text-gray-500">
              Hidden
            </span>
          )}

          {block.open_new_tab &&
            (block.type === "link" || block.type === "image") && (
              <span className="rounded-full bg-cyan-500/10 px-2 py-1 text-xs text-cyan-400">
                ↗ New tab
              </span>
            )}
        </div>

        {block.type === "link" && block.url && (
          <p className="mt-2 truncate text-sm text-gray-500">{block.url}</p>
        )}

        {block.type === "image" && block.image_url && (
          <div className="mt-3 flex items-center gap-3">
            <img
              src={block.image_url}
              alt={block.title || "Uploaded image"}
              className="h-14 w-14 rounded-lg object-cover"
            />
            <div className="min-w-0">
              <p className="truncate text-sm text-gray-500">Uploaded image</p>
              {block.url && (
                <p className="mt-1 truncate text-xs text-gray-600">
                  Click URL: {block.url}
                </p>
              )}
            </div>
          </div>
        )}

        {block.type === "video" && block.embed_url && (
          <p className="mt-2 truncate text-sm text-gray-500">
            {block.embed_url}
          </p>
        )}

        {block.type === "email" && block.email && (
          <p className="mt-2 text-sm text-gray-500">{block.email}</p>
        )}

        {block.type === "heading" && block.description && (
          <p className="mt-2 text-sm text-gray-500">{block.description}</p>
        )}

        {block.type === "text" && block.description && (
          <p className="mt-2 line-clamp-2 text-sm text-gray-500">
            {block.description}
          </p>
        )}

        {block.type === "quote" && (
          <p className="mt-2 line-clamp-2 text-sm italic text-gray-500">
            “{block.title}”
            {block.description ? ` — ${block.description}` : ""}
          </p>
        )}

        {block.type === "spotify" && block.embed_url && (
          <p className="mt-2 truncate text-sm text-green-500">
            Spotify embed
          </p>
        )}

        {block.type === "countdown" && block.description && (
          <p className="mt-2 text-sm text-amber-400">
            ⏳ {new Date(block.description).toLocaleString()}
          </p>
        )}

        {block.type === "cta" && block.url && (
          <p className="mt-2 truncate text-sm text-gray-500">{block.url}</p>
        )}

        {block.type === "contact" && block.email && (
          <p className="mt-2 text-sm text-gray-500">{block.email}</p>
        )}

        {(block.schedule_start || block.schedule_end) && (
          <div className="mt-3 rounded-lg border border-cyan-500/10 bg-cyan-500/5 px-3 py-2 text-xs text-cyan-400">
            ⏰ Scheduled
            {block.schedule_start && (
              <span className="ml-2 text-gray-500">
                From {new Date(block.schedule_start).toLocaleString()}
              </span>
            )}
            {block.schedule_end && (
              <span className="ml-2 text-gray-500">
                Until {new Date(block.schedule_end).toLocaleString()}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
        {block.type === "link" && (
          <button
            type="button"
            onClick={onFeature}
            className={`rounded-lg border px-3 py-2 text-sm ${
              block.featured
                ? "border-violet-500/30 bg-violet-500/10 text-violet-400"
                : "border-white/10 hover:bg-white/5"
            }`}
          >
            {block.featured ? "⭐ Featured" : "☆ Feature"}
          </button>
        )}

        <button
          type="button"
          onClick={onToggle}
          className="rounded-lg border border-white/10 px-3 py-2 text-sm hover:bg-white/5"
        >
          {block.active ? "Hide" : "Show"}
        </button>

        <button
          type="button"
          onClick={onEdit}
          className="rounded-lg border border-white/10 px-3 py-2 text-sm hover:bg-white/5"
        >
          Edit
        </button>

        <button
          type="button"
          onClick={onDelete}
          className="rounded-lg border border-red-500/20 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

export default function LinksPage() {
  const router = useRouter();

  const [links, setLinks] = useState<LinkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [type, setType] = useState<BlockType>("link");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [embedUrl, setEmbedUrl] = useState("");
  const [email, setEmail] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [featured, setFeatured] = useState(false);
  const [openNewTab, setOpenNewTab] = useState(true);
  const [scheduleStart, setScheduleStart] = useState("");
  const [scheduleEnd, setScheduleEnd] = useState("");
  const [countdownDate, setCountdownDate] = useState("");
  const [countdownHour, setCountdownHour] = useState("12");
  const [countdownMinute, setCountdownMinute] = useState("00");
  const [countdownPeriod, setCountdownPeriod] = useState<"AM" | "PM">("PM");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  useEffect(() => {
    loadLinks();
  }, []);

  async function getUserSite() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return null;
    }

    const { data: site, error } = await supabase
      .from("sites")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error || !site) {
      console.error(error);
      alert("Your site could not be found.");
      return null;
    }

    return site;
  }

  async function loadLinks() {
    const site = await getUserSite();

    if (!site) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("links")
      .select("*")
      .eq("site_id", site.id)
      .order("position", { ascending: true });

    if (error) {
      console.error(error);
      alert(error.message);
    } else {
      setLinks((data || []) as LinkItem[]);
    }

    setLoading(false);
  }

  function resetForm() {
    setEditingId(null);
    setType("link");
    setTitle("");
    setUrl("");
    setDescription("");
    setImageUrl("");
    setEmbedUrl("");
    setEmail("");
    setFeatured(false);
    setOpenNewTab(true);
    setScheduleStart("");
    setScheduleEnd("");
    setCountdownDate("");
    setCountdownHour("12");
    setCountdownMinute("00");
    setCountdownPeriod("PM");
  }

  function startEdit(block: LinkItem) {
    setEditingId(block.id);
    setType(block.type || "link");
    setTitle(block.title || "");
    setUrl(block.url || "");
    if (block.type === "countdown" && block.description) {
      const local = toDateTimeLocal(block.description);
      const [datePart, timePart] = local.split("T");
      const [hour24Raw, minuteRaw] = (timePart || "12:00").split(":");
      const hour24 = Number(hour24Raw || "12");
      const period = hour24 >= 12 ? "PM" : "AM";
      const hour12 = hour24 % 12 || 12;

      setDescription("");
      setCountdownDate(datePart || "");
      setCountdownHour(String(hour12).padStart(2, "0"));
      setCountdownMinute(minuteRaw || "00");
      setCountdownPeriod(period);
    } else {
      setDescription(block.description || "");
      setCountdownDate("");
      setCountdownHour("12");
      setCountdownMinute("00");
      setCountdownPeriod("PM");
    }
    setImageUrl(block.image_url || "");
    setEmbedUrl(block.embed_url || "");
    setEmail(block.email || "");
    setFeatured(Boolean(block.featured));
    setOpenNewTab(block.open_new_tab ?? true);

    setScheduleStart(
      block.schedule_start ? toDateTimeLocal(block.schedule_start) : ""
    );

    setScheduleEnd(
      block.schedule_end ? toDateTimeLocal(block.schedule_end) : ""
    );

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function uploadImage(file: File) {
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert("Image must be smaller than 10MB.");
      return;
    }

    setUploading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const site = await getUserSite();
      if (!site) return;

      const extension = file.name.split(".").pop() || "jpg";
      const fileName = `${crypto.randomUUID()}.${extension}`;
      const filePath = `${user.id}/${site.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("site-assets")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) {
        console.error(uploadError);
        alert(uploadError.message);
        return;
      }

      const { data: publicData } = supabase.storage
        .from("site-assets")
        .getPublicUrl(filePath);

      if (!publicData.publicUrl) {
        alert("Image uploaded but public URL could not be created.");
        return;
      }

      setImageUrl(publicData.publicUrl);
    } finally {
      setUploading(false);
    }
  }

  function getCountdownLocalDateTime() {
    let hour = Number(countdownHour);

    if (countdownPeriod === "AM") {
      if (hour === 12) hour = 0;
    } else {
      if (hour !== 12) hour += 12;
    }

    return `${countdownDate}T${String(hour).padStart(2, "0")}:${countdownMinute}`;
  }

  async function saveBlock() {
    if (type !== "divider" && !title.trim()) {
      alert("Please enter a title.");
      return;
    }

    if (type === "link" && !url.trim()) {
      alert("Please enter a URL.");
      return;
    }

    if (type === "image" && !imageUrl.trim()) {
      alert("Please upload an image.");
      return;
    }

    if (type === "video" && !embedUrl.trim()) {
      alert("Please enter a YouTube URL.");
      return;
    }

    if ((type === "email" || type === "contact") && !email.trim()) {
      alert("Please enter an email address.");
      return;
    }

    if (type === "text" && !description.trim()) {
      alert("Please enter some text.");
      return;
    }

    if (type === "spotify" && !embedUrl.trim()) {
      alert("Please enter a Spotify URL.");
      return;
    }

    if (type === "countdown" && !countdownDate) {
      alert("Please choose a countdown date.");
      return;
    }

    if (type === "cta" && !url.trim()) {
      alert("Please enter the CTA destination URL.");
      return;
    }

    if (type === "video" && !getYoutubeEmbedUrl(embedUrl)) {
      alert("Please enter a valid YouTube URL.");
      return;
    }

    if (type === "spotify" && !getSpotifyEmbedUrl(embedUrl)) {
      alert("Please enter a valid open.spotify.com URL.");
      return;
    }

    if (
      scheduleStart &&
      scheduleEnd &&
      new Date(scheduleStart) >= new Date(scheduleEnd)
    ) {
      alert("The end time must be after the start time.");
      return;
    }

    setSaving(true);

    try {
      const site = await getUserSite();
      if (!site) return;

      const finalUrl =
        type === "link" || type === "image" || type === "cta"
          ? normalizeUrl(url)
          : "";

      const finalEmbedUrl =
        type === "video"
          ? getYoutubeEmbedUrl(embedUrl)
          : type === "spotify"
          ? getSpotifyEmbedUrl(embedUrl)
          : null;

      const scheduleStartValue = scheduleStart
        ? new Date(scheduleStart).toISOString()
        : null;

      const scheduleEndValue = scheduleEnd
        ? new Date(scheduleEnd).toISOString()
        : null;

      if (featured && type === "link") {
        let clearQuery = supabase
          .from("links")
          .update({ featured: false })
          .eq("site_id", site.id);

        if (editingId) {
          clearQuery = clearQuery.neq("id", editingId);
        }

        const { error: clearError } = await clearQuery;

        if (clearError) {
          console.error(clearError);
          alert(clearError.message);
          return;
        }
      }

      const payload = {
        type,
        title: type === "divider" ? "Divider" : title.trim(),
        url: finalUrl,
        description:
          type === "countdown"
            ? new Date(getCountdownLocalDateTime()).toISOString()
            : description.trim() || null,
        image_url: type === "image" ? imageUrl : null,
        embed_url:
          type === "video" || type === "spotify" ? finalEmbedUrl : null,
        email:
          type === "email" || type === "contact" ? email.trim() : null,
        featured: type === "link" ? featured : false,
        open_new_tab:
          type === "link" || type === "image" || type === "cta"
            ? openNewTab
            : false,
        schedule_start: scheduleStartValue,
        schedule_end: scheduleEndValue,
      };

      if (editingId) {
        const { data, error } = await supabase
          .from("links")
          .update(payload)
          .eq("id", editingId)
          .eq("site_id", site.id)
          .select()
          .single();

        if (error) {
          console.error(error);
          alert(error.message);
          return;
        }

        setLinks((current) =>
          current.map((block) => {
            if (block.id === editingId) return data as LinkItem;

            if (featured && type === "link") {
              return { ...block, featured: false };
            }

            return block;
          })
        );

        resetForm();
        return;
      }

      const nextPosition =
        links.length > 0
          ? Math.max(...links.map((block) => block.position)) + 1
          : 0;

      const { data, error } = await supabase
        .from("links")
        .insert({
          site_id: site.id,
          ...payload,
          position: nextPosition,
          active: true,
        })
        .select()
        .single();

      if (error) {
        console.error(error);
        alert(error.message);
        return;
      }

      setLinks((current) => [
        ...(featured && type === "link"
          ? current.map((block) => ({ ...block, featured: false }))
          : current),
        data as LinkItem,
      ]);

      resetForm();
    } finally {
      setSaving(false);
    }
  }

  async function deleteBlock(id: string) {
    if (!confirm("Delete this block?")) return;

    const site = await getUserSite();
    if (!site) return;

    const { error } = await supabase
      .from("links")
      .delete()
      .eq("id", id)
      .eq("site_id", site.id);

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    setLinks((current) => current.filter((block) => block.id !== id));
  }

  async function toggleBlock(block: LinkItem) {
    const { error } = await supabase
      .from("links")
      .update({ active: !block.active })
      .eq("id", block.id)
      .eq("site_id", block.site_id);

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    setLinks((current) =>
      current.map((item) =>
        item.id === block.id ? { ...item, active: !item.active } : item
      )
    );
  }

  async function toggleFeatured(block: LinkItem) {
    if (block.featured) {
      const { error } = await supabase
        .from("links")
        .update({ featured: false })
        .eq("id", block.id)
        .eq("site_id", block.site_id);

      if (error) {
        console.error(error);
        alert(error.message);
        return;
      }

      setLinks((current) =>
        current.map((item) =>
          item.id === block.id ? { ...item, featured: false } : item
        )
      );
      return;
    }

    const { error: clearError } = await supabase
      .from("links")
      .update({ featured: false })
      .eq("site_id", block.site_id)
      .neq("id", block.id);

    if (clearError) {
      console.error(clearError);
      alert(clearError.message);
      return;
    }

    const { error } = await supabase
      .from("links")
      .update({ featured: true })
      .eq("id", block.id)
      .eq("site_id", block.site_id);

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    setLinks((current) =>
      current.map((item) => ({
        ...item,
        featured: item.id === block.id,
      }))
    );
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = links.findIndex((block) => block.id === active.id);
    const newIndex = links.findIndex((block) => block.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(links, oldIndex, newIndex);

    const updated = reordered.map((block, index) => ({
      ...block,
      position: index,
    }));

    setLinks(updated);

    const results = await Promise.all(
      updated.map((block) =>
        supabase
          .from("links")
          .update({ position: block.position })
          .eq("id", block.id)
          .eq("site_id", block.site_id)
      )
    );

    const failed = results.find((result) => result.error);

    if (failed?.error) {
      console.error(failed.error);
      alert("Order changed locally, but one or more positions failed to save.");
    }
  }

  function renderTypeFields() {
    if (type === "link") {
      return (
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://youtube.com/@username"
          className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-violet-500"
        />
      );
    }

    if (type === "heading") {
      return (
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional supporting text"
          rows={3}
          className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-violet-500"
        />
      );
    }

    if (type === "image") {
      return (
        <div className="space-y-4">
          <div className="rounded-xl border border-dashed border-white/15 bg-black/30 p-5">
            <label className="block cursor-pointer">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadImage(file);
                  e.currentTarget.value = "";
                }}
              />

              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 text-center transition hover:bg-white/[0.06]">
                <div className="text-3xl">🖼️</div>
                <p className="mt-2 font-medium">
                  {uploading ? "Uploading..." : "Choose an image"}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  JPG, PNG, WEBP or GIF · Max 10MB
                </p>
              </div>
            </label>
          </div>

          {imageUrl && (
            <div className="overflow-hidden rounded-xl border border-white/10">
              <img
                src={imageUrl}
                alt="Preview"
                className="max-h-72 w-full bg-black/30 object-contain"
              />
              <div className="p-3 text-xs text-gray-500">
                Image uploaded successfully.
              </div>
            </div>
          )}

          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Optional click URL"
            className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-violet-500"
          />
        </div>
      );
    }

    if (type === "video") {
      const previewUrl = embedUrl ? getYoutubeEmbedUrl(embedUrl) : null;

      return (
        <div className="space-y-3">
          <input
            value={embedUrl}
            onChange={(e) => setEmbedUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-violet-500"
          />

          <p className="text-xs text-gray-500">
            Paste a normal YouTube video URL, Shorts URL, youtu.be URL, or embed
            URL.
          </p>

          {previewUrl && (
            <div className="overflow-hidden rounded-xl border border-white/10 bg-black">
              <div className="relative aspect-video">
                <iframe
                  src={previewUrl}
                  title="YouTube preview"
                  className="absolute inset-0 h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            </div>
          )}
        </div>
      );
    }

    if (type === "text") {
      return (
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Write your announcement, introduction or short paragraph..."
          rows={5}
          className="w-full resize-none rounded-xl border border-white/10 bg-black/40 px-4 py-3 leading-6 outline-none focus:border-violet-500"
        />
      );
    }

    if (type === "divider") {
      return (
        <div className="rounded-xl border border-white/10 bg-black/30 p-4 text-sm text-gray-500">
          A simple divider will be added between sections. No extra content is required.
        </div>
      );
    }

    if (type === "quote") {
      return (
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional source or person, e.g. Maya Angelou"
          className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-violet-500"
        />
      );
    }

    if (type === "spotify") {
      const previewUrl = embedUrl ? getSpotifyEmbedUrl(embedUrl) : null;

      return (
        <div className="space-y-3">
          <input
            value={embedUrl}
            onChange={(e) => setEmbedUrl(e.target.value)}
            placeholder="https://open.spotify.com/track/..."
            className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-violet-500"
          />

          <p className="text-xs text-gray-500">
            Paste a Spotify track, album, playlist, podcast episode, show, or artist URL.
          </p>

          {previewUrl && (
            <div className="overflow-hidden rounded-xl border border-white/10">
              <iframe
                src={previewUrl}
                width="100%"
                height="152"
                frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                title="Spotify preview"
                className="block w-full"
              />
            </div>
          )}
        </div>
      );
    }

    if (type === "countdown") {
      return (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs text-gray-500">
                📅 Date
              </label>

              <input
                type="date"
                value={countdownDate}
                onChange={(e) => setCountdownDate(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs text-gray-500">
                🕒 Time
              </label>

              <div className="grid grid-cols-[1fr_auto_1fr_1fr] items-center gap-2">
                <select
                  value={countdownHour}
                  onChange={(e) => setCountdownHour(e.target.value)}
                  className="min-w-0 rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-sm outline-none focus:border-violet-500"
                >
                  {Array.from({ length: 12 }, (_, index) => {
                    const value = String(index + 1).padStart(2, "0");

                    return (
                      <option key={value} value={value} className="bg-black">
                        {value}
                      </option>
                    );
                  })}
                </select>

                <span className="text-gray-500">:</span>

                <select
                  value={countdownMinute}
                  onChange={(e) => setCountdownMinute(e.target.value)}
                  className="min-w-0 rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-sm outline-none focus:border-violet-500"
                >
                  {["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"].map(
                    (minute) => (
                      <option key={minute} value={minute} className="bg-black">
                        {minute}
                      </option>
                    )
                  )}
                </select>

                <select
                  value={countdownPeriod}
                  onChange={(e) =>
                    setCountdownPeriod(e.target.value as "AM" | "PM")
                  }
                  className="min-w-0 rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-sm outline-none focus:border-violet-500"
                >
                  <option value="AM" className="bg-black">
                    AM
                  </option>
                  <option value="PM" className="bg-black">
                    PM
                  </option>
                </select>
              </div>

              <p className="mt-2 text-xs text-gray-600">
                {countdownHour}:{countdownMinute} {countdownPeriod}
              </p>
            </div>
          </div>

          <p className="text-xs text-gray-500">
            Choose the exact local date and time for the countdown target.
          </p>
        </div>
      );
    }

    if (type === "cta") {
      return (
        <div className="space-y-3">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional supporting text"
            rows={3}
            className="w-full resize-none rounded-xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-violet-500"
          />

          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://your-destination.com"
            className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-violet-500"
          />
        </div>
      );
    }

    if (type === "email" || type === "contact") {
      return (
        <div className="space-y-3">
          {type === "contact" && (
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional message, e.g. Open for collaborations and brand partnerships."
              rows={3}
              className="w-full resize-none rounded-xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-violet-500"
            />
          )}

          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="creator@example.com"
            className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-violet-500"
          />
        </div>
      );
    }

    return null;
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050505] text-white">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-violet-500" />
          <p className="mt-4 text-sm text-gray-500">Loading blocks...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050505] px-5 py-8 text-white sm:px-6 lg:py-10">
      <div className="mx-auto max-w-6xl">
        <section className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/[0.07] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-violet-300">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
            Blocks
          </div>

          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Your page blocks
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-500 sm:text-base">
            Build your creator page with links, text, media, calls-to-action and interactive blocks.
          </p>
        </section>

        <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-600">
                {editingId ? "Editing" : "Create"}
              </p>
              <h2 className="mt-2 text-xl font-semibold">
                {editingId ? "Edit block" : "Add a block"}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Choose what you want to add to your public profile.
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-gray-500">
              {links.length} {links.length === 1 ? "block" : "blocks"} total
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {BLOCK_TYPES.map((blockType) => (
              <button
                key={blockType.value}
                type="button"
                onClick={() => {
                  setType(blockType.value);

                  if (blockType.value !== "link") {
                    setFeatured(false);
                  }

                  if (
                    blockType.value !== "link" &&
                    blockType.value !== "image" &&
                    blockType.value !== "cta"
                  ) {
                    setOpenNewTab(false);
                  }
                }}
                className={`rounded-xl border p-4 text-left transition ${
                  type === blockType.value
                    ? "border-violet-500/60 bg-violet-500/10 shadow-lg shadow-violet-950/10"
                    : "border-white/10 bg-black/20 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.05]"
                }`}
              >
                <div className="text-xl">{blockType.icon}</div>
                <p className="mt-2 font-medium">{blockType.label}</p>
                <p className="mt-1 text-xs text-gray-500">
                  {blockType.description}
                </p>
              </button>
            ))}
          </div>

          <div className="mt-6 space-y-4">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                type === "heading"
                  ? "Section heading"
                  : type === "text"
                  ? "Optional text heading"
                  : type === "divider"
                  ? "Divider"
                  : type === "quote"
                  ? "Write the quote"
                  : type === "image"
                  ? "Image title"
                  : type === "video"
                  ? "Video title"
                  : type === "spotify"
                  ? "Spotify title"
                  : type === "countdown"
                  ? "Launch countdown"
                  : type === "cta"
                  ? "CTA title"
                  : type === "contact"
                  ? "Let's work together"
                  : type === "email"
                  ? "Contact me"
                  : "Link title"
              }
              disabled={type === "divider"}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-violet-500"
            />

            {renderTypeFields()}

            {type === "link" && (
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-black/30 p-4">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="h-4 w-4 accent-violet-500"
                />

                <div>
                  <p className="font-medium">⭐ Make this featured</p>
                  <p className="text-sm text-gray-500">
                    Highlight this link on your public page.
                  </p>
                </div>
              </label>
            )}

            {(type === "link" || type === "image" || type === "cta") && (
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-black/30 p-4">
                <input
                  type="checkbox"
                  checked={openNewTab}
                  onChange={(e) => setOpenNewTab(e.target.checked)}
                  className="h-4 w-4 accent-cyan-500"
                />

                <div>
                  <p className="font-medium">↗ Open in a new tab</p>
                  <p className="text-sm text-gray-500">
                    Keep the creator page open when visitors click this item.
                  </p>
                </div>
              </label>
            )}

            <div className="rounded-xl border border-white/10 bg-black/30 p-4">
              <p className="font-medium">⏰ Schedule block</p>
              <p className="mt-1 text-sm text-gray-500">
                Leave both empty to keep the block visible normally.
              </p>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs text-gray-500">
                    Start
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduleStart}
                    onChange={(e) => setScheduleStart(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-sm outline-none focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs text-gray-500">
                    End
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduleEnd}
                    onChange={(e) => setScheduleEnd(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-sm outline-none focus:border-violet-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={saveBlock}
                disabled={saving || uploading}
                className="rounded-xl bg-violet-500 px-5 py-3 font-semibold text-white hover:bg-violet-400 disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : editingId
                  ? "Save changes"
                  : "Add block"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-xl border border-white/10 px-5 py-3 hover:bg-white/5"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>

        <section className="mt-8 pb-10">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-600">Page structure</p>
              <h2 className="mt-2 text-xl font-semibold">Current blocks</h2>
              <p className="mt-1 text-sm text-gray-500">Drag blocks to change the order visitors see them.</p>
            </div>
          </div>

          {links.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.015] p-10 text-center text-gray-500">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04] text-xl">🧱</div>
              <p className="mt-4 font-medium text-gray-300">No blocks yet</p>
              <p className="mt-2 text-sm text-gray-600">Add your first block above to start building your page.</p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={links.map((block) => block.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {links.map((block) => (
                    <SortableBlock
                      key={block.id}
                      block={block}
                      onToggle={() => toggleBlock(block)}
                      onEdit={() => startEdit(block)}
                      onDelete={() => deleteBlock(block.id)}
                      onFeature={() => toggleFeatured(block)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </section>
      </div>
    </main>
  );
}