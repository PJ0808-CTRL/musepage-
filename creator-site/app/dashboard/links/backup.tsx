
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
  | "image"
  | "video"
  | "email";

type LinkItem = {
  id: string;
  site_id: string;
  title: string;
  url: string;
  active: boolean;
  position: number;
  featured: boolean;
  schedule_start: string | null;
  schedule_end: string | null;

  type: BlockType;
  image_url: string | null;
  description: string | null;
  embed_url: string | null;
  email: string | null;
  open_new_tab: boolean;
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
    description: "Display an image",
  },
  {
    value: "video",
    label: "YouTube Video",
    icon: "🎥",
    description: "Embed a YouTube video",
  },
  {
    value: "email",
    label: "Email",
    icon: "📧",
    description: "Create an email button",
  },
];

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
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    id: block.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const typeInfo =
    BLOCK_TYPES.find(
      (item) => item.value === block.type
    ) || BLOCK_TYPES[0];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-2xl border p-5 transition ${
        block.active
          ? "border-white/10 bg-white/[0.03]"
          : "border-white/5 bg-white/[0.01] opacity-50"
      } ${
        block.featured
          ? "border-violet-500/40 bg-violet-500/[0.05]"
          : ""
      }`}
    >
      <div className="flex gap-4">
        {/* DRAG */}

        <button
          {...attributes}
          {...listeners}
          type="button"
          className="h-fit cursor-grab touch-none rounded-lg px-2 py-2 text-gray-500 hover:bg-white/5 hover:text-white active:cursor-grabbing"
          title="Drag to reorder"
        >
          ⋮⋮
        </button>

        {/* BLOCK INFO */}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-lg bg-white/5 px-2 py-1 text-xs">
              {typeInfo.icon} {typeInfo.label}
            </span>

            <h3 className="truncate font-semibold">
              {block.title || typeInfo.label}
            </h3>

            {block.featured && (
              <span className="rounded-full bg-violet-500/15 px-2 py-1 text-xs font-medium text-violet-400">
                ⭐ Featured
              </span>
            )}

            {!block.active && (
              <span className="rounded-full bg-gray-500/10 px-2 py-1 text-xs text-gray-500">
                Hidden
              </span>
            )}
          </div>

          {block.type === "link" && block.url && (
            <p className="mt-2 truncate text-sm text-gray-500">
              {block.url}
            </p>
          )}

          {block.type === "image" &&
            block.image_url && (
              <p className="mt-2 truncate text-sm text-gray-500">
                {block.image_url}
              </p>
            )}

          {block.type === "video" &&
            block.embed_url && (
              <p className="mt-2 truncate text-sm text-gray-500">
                {block.embed_url}
              </p>
            )}

          {block.type === "email" &&
            block.email && (
              <p className="mt-2 text-sm text-gray-500">
                {block.email}
              </p>
            )}

          {block.type === "heading" &&
            block.description && (
              <p className="mt-2 text-sm text-gray-500">
                {block.description}
              </p>
            )}

          {(block.schedule_start ||
            block.schedule_end) && (
            <div className="mt-3 rounded-lg border border-cyan-500/10 bg-cyan-500/5 px-3 py-2 text-xs text-cyan-400">
              ⏰ Scheduled

              {block.schedule_start && (
                <span className="ml-2 text-gray-500">
                  From{" "}
                  {new Date(
                    block.schedule_start
                  ).toLocaleString()}
                </span>
              )}

              {block.schedule_end && (
                <span className="ml-2 text-gray-500">
                  Until{" "}
                  {new Date(
                    block.schedule_end
                  ).toLocaleString()}
                </span>
              )}
            </div>
          )}
        </div>

        {/* ACTIONS */}

        <div className="flex shrink-0 flex-wrap justify-end gap-2">
          {block.type === "link" && (
            <button
              type="button"
              onClick={onFeature}
              className={`rounded-lg border px-3 py-2 text-sm transition ${
                block.featured
                  ? "border-violet-500/30 bg-violet-500/10 text-violet-400"
                  : "border-white/10 hover:bg-white/5"
              }`}
            >
              {block.featured
                ? "⭐ Featured"
                : "☆ Feature"}
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
    </div>
  );
}

export default function LinksPage() {
  const router = useRouter();

  const [links, setLinks] = useState<LinkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [type, setType] =
    useState<BlockType>("link");

  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");

  const [description, setDescription] =
    useState("");

  const [imageUrl, setImageUrl] =
    useState("");

  const [embedUrl, setEmbedUrl] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [openNewTab, setOpenNewTab] =
    useState(true);

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [featured, setFeatured] =
    useState(false);

  const [scheduleStart, setScheduleStart] =
    useState("");

  const [scheduleEnd, setScheduleEnd] =
    useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    loadLinks();
  }, []);

  async function loadLinks() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const {
      data: site,
      error: siteError,
    } = await supabase
      .from("sites")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (siteError || !site) {
      console.error(siteError);
      alert("Your site could not be found.");
      router.push("/dashboard");
      return;
    }

    const {
      data,
      error,
    } = await supabase
      .from("links")
      .select("*")
      .eq("site_id", site.id)
      .order("position", {
        ascending: true,
      });

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    setLinks(data || []);
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
    setOpenNewTab(true);
    setFeatured(false);
    setScheduleStart("");
    setScheduleEnd("");
  }

  function startEdit(block: LinkItem) {
    setEditingId(block.id);
    setType(block.type || "link");

    setTitle(block.title || "");
    setUrl(block.url || "");

    setDescription(
      block.description || ""
    );

    setImageUrl(
      block.image_url || ""
    );

    setEmbedUrl(
      block.embed_url || ""
    );

    setEmail(block.email || "");

    setOpenNewTab(
      block.open_new_tab !== false
    );

    setFeatured(block.featured);

    setScheduleStart(
      block.schedule_start
        ? toDateTimeLocal(
            block.schedule_start
          )
        : ""
    );

    setScheduleEnd(
      block.schedule_end
        ? toDateTimeLocal(
            block.schedule_end
          )
        : ""
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function toDateTimeLocal(
    value: string
  ) {
    const date = new Date(value);

    const offset =
      date.getTimezoneOffset();

    const localDate = new Date(
      date.getTime() -
        offset * 60 * 1000
    );

    return localDate
      .toISOString()
      .slice(0, 16);
  }

  async function saveBlock() {
    if (!title.trim()) {
      alert("Please enter a title.");
      return;
    }

    if (
      type === "link" &&
      !url.trim()
    ) {
      alert("Please enter a URL.");
      return;
    }

    if (
      type === "image" &&
      !imageUrl.trim()
    ) {
      alert("Please enter an image URL.");
      return;
    }

    if (
      type === "video" &&
      !embedUrl.trim()
    ) {
      alert("Please enter a YouTube URL.");
      return;
    }

    if (
      type === "email" &&
      !email.trim()
    ) {
      alert("Please enter an email address.");
      return;
    }

    if (
      scheduleStart &&
      scheduleEnd &&
      new Date(scheduleStart) >=
        new Date(scheduleEnd)
    ) {
      alert(
        "The end time must be after the start time."
      );
      return;
    }

    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSaving(false);
      router.push("/login");
      return;
    }

    const {
      data: site,
      error: siteError,
    } = await supabase
      .from("sites")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (siteError || !site) {
      alert("Your site could not be found.");
      setSaving(false);
      return;
    }

    let finalUrl = url.trim();

    if (
      finalUrl &&
      !finalUrl.startsWith("http://") &&
      !finalUrl.startsWith("https://") &&
      !finalUrl.startsWith("mailto:")
    ) {
      finalUrl = "https://" + finalUrl;
    }

    let finalImageUrl =
      imageUrl.trim();

    if (
      finalImageUrl &&
      !finalImageUrl.startsWith(
        "http://"
      ) &&
      !finalImageUrl.startsWith(
        "https://"
      )
    ) {
      finalImageUrl =
        "https://" + finalImageUrl;
    }

    let finalEmbedUrl =
      embedUrl.trim();

    if (
      finalEmbedUrl &&
      !finalEmbedUrl.startsWith(
        "http://"
      ) &&
      !finalEmbedUrl.startsWith(
        "https://"
      )
    ) {
      finalEmbedUrl =
        "https://" + finalEmbedUrl;
    }

    const scheduleStartValue =
      scheduleStart
        ? new Date(
            scheduleStart
          ).toISOString()
        : null;

    const scheduleEndValue =
      scheduleEnd
        ? new Date(
            scheduleEnd
          ).toISOString()
        : null;

    if (editingId) {
      if (featured && type === "link") {
        await supabase
          .from("links")
          .update({
            featured: false,
          })
          .eq("site_id", site.id)
          .neq("id", editingId);
      }

      const {
        data,
        error,
      } = await supabase
        .from("links")
        .update({
          type,
          title: title.trim(),
          url:
            type === "link"
              ? finalUrl
              : "",
          description:
            description.trim() ||
            null,
          image_url:
            type === "image"
              ? finalImageUrl
              : null,
          embed_url:
            type === "video"
              ? finalEmbedUrl
              : null,
          email:
            type === "email"
              ? email.trim()
              : null,
          open_new_tab:
            openNewTab,
          featured:
            type === "link"
              ? featured
              : false,
          schedule_start:
            scheduleStartValue,
          schedule_end:
            scheduleEndValue,
        })
        .eq("id", editingId)
        .eq("site_id", site.id)
        .select()
        .single();

      if (error) {
        console.error(error);
        alert(error.message);
        setSaving(false);
        return;
      }

      setLinks((current) =>
        current.map((block) =>
          block.id === editingId
            ? data
            : featured &&
              type === "link"
            ? {
                ...block,
                featured: false,
              }
            : block
        )
      );

      resetForm();
      setSaving(false);
      return;
    }

    const nextPosition =
      links.length > 0
        ? Math.max(
            ...links.map(
              (block) =>
                block.position
            )
          ) + 1
        : 0;

    if (featured && type === "link") {
      const { error } =
        await supabase
          .from("links")
          .update({
            featured: false,
          })
          .eq(
            "site_id",
            site.id
          );

      if (error) {
        console.error(error);
        alert(error.message);
        setSaving(false);
        return;
      }
    }

    const {
      data,
      error,
    } = await supabase
      .from("links")
      .insert({
        site_id: site.id,
        type,
        title: title.trim(),
        url:
          type === "link"
            ? finalUrl
            : "",
        position: nextPosition,
        active: true,
        featured:
          type === "link"
            ? featured
            : false,
        description:
          description.trim() ||
          null,
        image_url:
          type === "image"
            ? finalImageUrl
            : null,
        embed_url:
          type === "video"
            ? finalEmbedUrl
            : null,
        email:
          type === "email"
            ? email.trim()
            : null,
        open_new_tab:
          openNewTab,
        schedule_start:
          scheduleStartValue,
        schedule_end:
          scheduleEndValue,
      })
      .select()
      .single();

    if (error) {
      console.error(error);
      alert(error.message);
      setSaving(false);
      return;
    }

    setLinks((current) => [
      ...(featured && type === "link"
        ? current.map((block) => ({
            ...block,
            featured: false,
          }))
        : current),
      data,
    ]);

    resetForm();
    setSaving(false);
  }

  async function deleteBlock(
    id: string
  ) {
    if (
      !confirm(
        "Delete this block?"
      )
    ) {
      return;
    }

    const { error } =
      await supabase
        .from("links")
        .delete()
        .eq("id", id);

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    setLinks((current) =>
      current.filter(
        (block) =>
          block.id !== id
      )
    );
  }

  async function toggleBlock(
    block: LinkItem
  ) {
    const { error } =
      await supabase
        .from("links")
        .update({
          active: !block.active,
        })
        .eq("id", block.id);

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    setLinks((current) =>
      current.map((item) =>
        item.id === block.id
          ? {
              ...item,
              active:
                !item.active,
            }
          : item
      )
    );
  }

  async function toggleFeatured(
    block: LinkItem
  ) {
    if (block.featured) {
      const { error } =
        await supabase
          .from("links")
          .update({
            featured: false,
          })
          .eq("id", block.id);

      if (error) {
        console.error(error);
        alert(error.message);
        return;
      }

      setLinks((current) =>
        current.map((item) =>
          item.id === block.id
            ? {
                ...item,
                featured: false,
              }
            : item
        )
      );

      return;
    }

    const {
      error: clearError,
    } = await supabase
      .from("links")
      .update({
        featured: false,
      })
      .eq("site_id", block.site_id)
      .neq("id", block.id);

    if (clearError) {
      console.error(clearError);
      alert(clearError.message);
      return;
    }

    const { error } =
      await supabase
        .from("links")
        .update({
          featured: true,
        })
        .eq("id", block.id);

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    setLinks((current) =>
      current.map((item) => ({
        ...item,
        featured:
          item.id === block.id,
      }))
    );
  }

  async function handleDragEnd(
    event: DragEndEvent
  ) {
    const {
      active,
      over,
    } = event;

    if (
      !over ||
      active.id === over.id
    ) {
      return;
    }

    const oldIndex =
      links.findIndex(
        (block) =>
          block.id === active.id
      );

    const newIndex =
      links.findIndex(
        (block) =>
          block.id === over.id
      );

    if (
      oldIndex === -1 ||
      newIndex === -1
    ) {
      return;
    }

    const reordered =
      arrayMove(
        links,
        oldIndex,
        newIndex
      );

    const updated =
      reordered.map(
        (block, index) => ({
          ...block,
          position: index,
        })
      );

    setLinks(updated);

    for (const block of updated) {
      const { error } =
        await supabase
          .from("links")
          .update({
            position:
              block.position,
          })
          .eq(
            "id",
            block.id
          );

      if (error) {
        console.error(error);
      }
    }
  }

  function renderTypeFields() {
    if (type === "link") {
      return (
        <>
          <input
            value={url}
            onChange={(e) =>
              setUrl(e.target.value)
            }
            placeholder="https://youtube.com/@username"
            className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-violet-500"
          />

          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-black/30 p-4">
            <input
              type="checkbox"
              checked={openNewTab}
              onChange={(e) =>
                setOpenNewTab(
                  e.target.checked
                )
              }
              className="h-4 w-4 accent-violet-500"
            />

            <div>
              <p className="font-medium">
                Open in new tab
              </p>

              <p className="text-sm text-gray-500">
                Recommended for external links.
              </p>
            </div>
          </label>
        </>
      );
    }

    if (type === "heading") {
      return (
        <textarea
          value={description}
          onChange={(e) =>
            setDescription(
              e.target.value
            )
          }
          placeholder="Optional supporting text"
          rows={3}
          className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-violet-500"
        />
      );
    }

    if (type === "image") {
      return (
        <>
          <input
            value={imageUrl}
            onChange={(e) =>
              setImageUrl(
                e.target.value
              )
            }
            placeholder="https://example.com/image.jpg"
            className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-violet-500"
          />

          <input
            value={url}
            onChange={(e) =>
              setUrl(e.target.value)
            }
            placeholder="Optional click URL"
            className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-violet-500"
          />
        </>
      );
    }

    if (type === "video") {
      return (
        <>
          <input
            value={embedUrl}
            onChange={(e) =>
              setEmbedUrl(
                e.target.value
              )
            }
            placeholder="https://youtube.com/watch?v=..."
            className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-violet-500"
          />

          <p className="text-xs text-gray-500">
            Paste a normal YouTube video URL.
            The public profile will convert it into
            an embed automatically.
          </p>
        </>
      );
    }

    if (type === "email") {
      return (
        <>
          <input
            value={email}
            onChange={(e) =>
              setEmail(
                e.target.value
              )
            }
            type="email"
            placeholder="creator@example.com"
            className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-violet-500"
          />
        </>
      );
    }

    return null;
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-black p-8 text-white">
        Loading blocks...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black px-4 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-5xl">
        <button
          type="button"
          onClick={() =>
            router.push("/dashboard")
          }
          className="mb-4 text-sm text-gray-500 hover:text-white"
        >
          ← Dashboard
        </button>

        <h1 className="text-3xl font-bold">
          Your Page Blocks
        </h1>

        <p className="mt-2 text-gray-500">
          Build your creator page with links,
          headings, images, videos and email buttons.
        </p>

        {/* BUILDER */}

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold">
              {editingId
                ? "Edit block"
                : "Add a block"}
            </h2>

            <p className="text-sm text-gray-500">
              Choose what you want to add to your
              public profile.
            </p>
          </div>

          {/* TYPE SELECTOR */}

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {BLOCK_TYPES.map(
              (blockType) => (
                <button
                  key={blockType.value}
                  type="button"
                  onClick={() =>
                    setType(
                      blockType.value
                    )
                  }
                  className={`rounded-xl border p-4 text-left transition ${
                    type ===
                    blockType.value
                      ? "border-violet-500 bg-violet-500/10"
                      : "border-white/10 bg-black/20 hover:bg-white/5"
                  }`}
                >
                  <div className="text-xl">
                    {blockType.icon}
                  </div>

                  <p className="mt-2 font-medium">
                    {blockType.label}
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    {
                      blockType.description
                    }
                  </p>
                </button>
              )
            )}
          </div>

          {/* FORM */}

          <div className="mt-6 space-y-4">
            <input
              value={title}
              onChange={(e) =>
                setTitle(
                  e.target.value
                )
              }
              placeholder={
                type === "heading"
                  ? "Section heading"
                  : type === "image"
                  ? "Image title"
                  : type === "video"
                  ? "Video title"
                  : type === "email"
                  ? "Contact me"
                  : "Link title"
              }
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-violet-500"
            />

            {renderTypeFields()}

            {/* FEATURED */}

            {type === "link" && (
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-black/30 p-4">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) =>
                    setFeatured(
                      e.target.checked
                    )
                  }
                  className="h-4 w-4 accent-violet-500"
                />

                <div>
                  <p className="font-medium">
                    ⭐ Make this featured
                  </p>

                  <p className="text-sm text-gray-500">
                    Highlight this link on your
                    public page.
                  </p>
                </div>
              </label>
            )}

            {/* SCHEDULE */}

            <div className="rounded-xl border border-white/10 bg-black/30 p-4">
              <p className="font-medium">
                ⏰ Schedule block
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Leave both empty to keep the block
                visible normally.
              </p>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs text-gray-500">
                    Start
                  </label>

                  <input
                    type="datetime-local"
                    value={
                      scheduleStart
                    }
                    onChange={(e) =>
                      setScheduleStart(
                        e.target.value
                      )
                    }
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-sm outline-none focus:border-violet-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs text-gray-500">
                    End
                  </label>

                  <input
                    type="datetime-local"
                    value={
                      scheduleEnd
                    }
                    onChange={(e) =>
                      setScheduleEnd(
                        e.target.value
                      )
                    }
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-3 text-sm outline-none focus:border-violet-500"
                  />
                </div>
              </div>
            </div>

            {/* SAVE */}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={
                  saveBlock
                }
                disabled={saving}
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
                  onClick={
                    resetForm
                  }
                  className="rounded-xl border border-white/10 px-5 py-3 hover:bg-white/5"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>

        {/* BLOCK LIST */}

        <div className="mt-6">
          {links.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center text-gray-500">
              You haven't added any blocks yet.
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={
                closestCenter
              }
              onDragEnd={
                handleDragEnd
              }
            >
              <SortableContext
                items={links.map(
                  (block) =>
                    block.id
                )}
                strategy={
                  verticalListSortingStrategy
                }
              >
                <div className="space-y-3">
                  {links.map(
                    (block) => (
                      <SortableBlock
                        key={
                          block.id
                        }
                        block={
                          block
                        }
                        onToggle={() =>
                          toggleBlock(
                            block
                          )
                        }
                        onEdit={() =>
                          startEdit(
                            block
                          )
                        }
                        onDelete={() =>
                          deleteBlock(
                            block.id
                          )
                        }
                        onFeature={() =>
                          toggleFeatured(
                            block
                          )
                        }
                      />
                    )
                  )}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>
    </main>
  );
}

