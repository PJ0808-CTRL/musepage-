"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import MusePageLogo from "@/app/components/MusePageLogo";

type LuxuryCategory =
  | "atelier"
  | "noir"
  | "sage"
  | "oxblood"
  | "midnight";

type LegacyCategory =
  | "creator"
  | "minimal"
  | "business"
  | "musician"
  | "portfolio"
  | "launch";

type Category = LuxuryCategory | LegacyCategory;

type ExistingSite = {
  id: string;
  username: string;
};

type Template = {
  id: Category;
  name: string;
  eyebrow: string;
  symbol: string;
  description: string;
  preview: string;

  backgroundType: "solid" | "gradient";
  backgroundColor: string;
  gradientColor1: string;
  gradientColor2: string;
  gradientDirection: string;

  buttonColor: string;
  buttonTextColor: string;

  font: string;
  buttonStyle: "rounded" | "square" | "pill";
  buttonShadow: boolean;

  pageWidth: "compact" | "normal" | "wide";
  spacing: "tight" | "normal" | "loose";
  headerPosition: "left" | "center" | "right";

  starterHeading?: string;
};

type HomepageDraftTheme = {
  id: string;
  name: string;
  accent: string;
  accent2: string;
  glow: string;
  surface: string;
};

type HomepageDraft = {
  version: number;
  createdAt: number;

  displayName?: string;
  username?: string;
  bio?: string;
  firstLinkTitle?: string;

  theme?: HomepageDraftTheme;
};

const HOMEPAGE_DRAFT_KEY = "musepage-homepage-draft";

const HOMEPAGE_DRAFT_MAX_AGE =
  1000 * 60 * 60 * 24 * 7;

const templates: Template[] = [
  {
    id: "atelier",
    name: "Atelier",
    eyebrow: "Editorial",
    symbol: "A",
    description:
      "Warm espresso, antique gold, and editorial spacing for a refined creator presence.",
    preview:
      "linear-gradient(135deg,#171512 0%,#2a231c 55%,#6f5334 100%)",

    backgroundType: "gradient",
    backgroundColor: "#231f1a",
    gradientColor1: "#171512",
    gradientColor2: "#3a2d1f",
    gradientDirection: "145deg",

    buttonColor: "#8e6a3a",
    buttonTextColor: "#f8f1e6",

    font: "Georgia",
    buttonStyle: "rounded",
    buttonShadow: true,

    pageWidth: "normal",
    spacing: "loose",
    headerPosition: "center",

    starterHeading: "Selected work",
  },

  {
    id: "noir",
    name: "Noir",
    eyebrow: "Monochrome",
    symbol: "N",
    description:
      "Near-black surfaces, soft ivory type, and restrained contrast for a high-fashion feel.",
    preview:
      "linear-gradient(135deg,#0d0d0c 0%,#171715 55%,#34322e 100%)",

    backgroundType: "gradient",
    backgroundColor: "#121211",
    gradientColor1: "#0d0d0c",
    gradientColor2: "#24231f",
    gradientDirection: "180deg",

    buttonColor: "#34322e",
    buttonTextColor: "#f0e7d9",

    font: "Georgia",
    buttonStyle: "square",
    buttonShadow: false,

    pageWidth: "compact",
    spacing: "loose",
    headerPosition: "left",

    starterHeading: "Essentials",
  },

  {
    id: "sage",
    name: "Sage",
    eyebrow: "Botanical",
    symbol: "S",
    description:
      "Deep botanical greens and quiet cream accents for a calm, tactile identity.",
    preview:
      "linear-gradient(135deg,#121712 0%,#1d281d 56%,#60735c 100%)",

    backgroundType: "gradient",
    backgroundColor: "#19201a",
    gradientColor1: "#131813",
    gradientColor2: "#2b352a",
    gradientDirection: "145deg",

    buttonColor: "#60735c",
    buttonTextColor: "#f4f0e7",

    font: "Georgia",
    buttonStyle: "rounded",
    buttonShadow: true,

    pageWidth: "normal",
    spacing: "loose",
    headerPosition: "center",

    starterHeading: "Currently",
  },

  {
    id: "oxblood",
    name: "Oxblood",
    eyebrow: "Statement",
    symbol: "O",
    description:
      "Deep wine tones and muted copper accents for launches, artists, and bold personal brands.",
    preview:
      "linear-gradient(135deg,#170f0e 0%,#321a18 55%,#74463e 100%)",

    backgroundType: "gradient",
    backgroundColor: "#241817",
    gradientColor1: "#170f0e",
    gradientColor2: "#4a2522",
    gradientDirection: "135deg",

    buttonColor: "#74463e",
    buttonTextColor: "#f8eee8",

    font: "Georgia",
    buttonStyle: "rounded",
    buttonShadow: true,

    pageWidth: "normal",
    spacing: "normal",
    headerPosition: "center",

    starterHeading: "The new chapter",
  },

  {
    id: "midnight",
    name: "Midnight",
    eyebrow: "Modern",
    symbol: "M",
    description:
      "Blue-charcoal, brushed silver, and cool restraint for a polished digital presence.",
    preview:
      "linear-gradient(135deg,#101315 0%,#1d242b 55%,#687788 100%)",

    backgroundType: "gradient",
    backgroundColor: "#16191c",
    gradientColor1: "#101315",
    gradientColor2: "#26303b",
    gradientDirection: "145deg",

    buttonColor: "#687788",
    buttonTextColor: "#f4f6f8",

    font: "Inter",
    buttonStyle: "rounded",
    buttonShadow: true,

    pageWidth: "wide",
    spacing: "normal",
    headerPosition: "left",

    starterHeading: "On the internet",
  },

  {
    id: "creator",
    name: "Creator",
    eyebrow: "Social-first",
    symbol: "C",
    description:
      "Bold and social-first for creators and influencers.",
    preview:
      "linear-gradient(135deg,#160d2d 0%,#7c2d5e 58%,#f472b6 100%)",

    backgroundType: "gradient",
    backgroundColor: "#160d2d",
    gradientColor1: "#160d2d",
    gradientColor2: "#7c2d5e",
    gradientDirection: "135deg",

    buttonColor: "#f472b6",
    buttonTextColor: "#ffffff",

    font: "Inter",
    buttonStyle: "pill",
    buttonShadow: true,

    pageWidth: "normal",
    spacing: "normal",
    headerPosition: "center",

    starterHeading: "Find me online",
  },

  {
    id: "minimal",
    name: "Minimal",
    eyebrow: "Clean",
    symbol: "—",
    description:
      "Simple, quiet and distraction-free.",
    preview:
      "linear-gradient(135deg,#fafafa 0%,#e5e7eb 100%)",

    backgroundType: "solid",
    backgroundColor: "#fafafa",
    gradientColor1: "#fafafa",
    gradientColor2: "#fafafa",
    gradientDirection: "135deg",

    buttonColor: "#111111",
    buttonTextColor: "#111111",

    font: "Inter",
    buttonStyle: "square",
    buttonShadow: false,

    pageWidth: "compact",
    spacing: "tight",
    headerPosition: "left",

    starterHeading: "Selected links",
  },

  {
    id: "business",
    name: "Business",
    eyebrow: "Conversion",
    symbol: "B",
    description:
      "Professional, trustworthy, and focused on clear actions.",
    preview:
      "linear-gradient(135deg,#071a2b 0%,#164e63 100%)",

    backgroundType: "gradient",
    backgroundColor: "#071a2b",
    gradientColor1: "#071a2b",
    gradientColor2: "#164e63",
    gradientDirection: "135deg",

    buttonColor: "#22d3ee",
    buttonTextColor: "#ffffff",

    font: "Arial",
    buttonStyle: "rounded",
    buttonShadow: true,

    pageWidth: "wide",
    spacing: "normal",
    headerPosition: "left",

    starterHeading: "How we can help",
  },

  {
    id: "musician",
    name: "Musician",
    eyebrow: "Audio",
    symbol: "♪",
    description:
      "A nocturnal stage for music, releases, videos and shows.",
    preview:
      "linear-gradient(135deg,#020617 0%,#312e81 55%,#7e22ce 100%)",

    backgroundType: "gradient",
    backgroundColor: "#020617",
    gradientColor1: "#020617",
    gradientColor2: "#581c87",
    gradientDirection: "180deg",

    buttonColor: "#8b5cf6",
    buttonTextColor: "#ffffff",

    font: "Trebuchet MS",
    buttonStyle: "pill",
    buttonShadow: true,

    pageWidth: "normal",
    spacing: "loose",
    headerPosition: "center",

    starterHeading: "Listen now",
  },

  {
    id: "portfolio",
    name: "Portfolio",
    eyebrow: "Showcase",
    symbol: "P",
    description:
      "Editorial spacing that keeps your best work in focus.",
    preview:
      "linear-gradient(135deg,#18181b 0%,#44403c 100%)",

    backgroundType: "solid",
    backgroundColor: "#18181b",
    gradientColor1: "#18181b",
    gradientColor2: "#18181b",
    gradientDirection: "135deg",

    buttonColor: "#f5f5f4",
    buttonTextColor: "#ffffff",

    font: "Georgia",
    buttonStyle: "square",
    buttonShadow: false,

    pageWidth: "wide",
    spacing: "loose",
    headerPosition: "left",

    starterHeading: "Selected work",
  },

  {
    id: "launch",
    name: "Launch",
    eyebrow: "Campaign",
    symbol: "L",
    description:
      "High contrast, urgent, and ready for your next release.",
    preview:
      "linear-gradient(135deg,#1c0b0b 0%,#9f1239 58%,#f97316 100%)",

    backgroundType: "gradient",
    backgroundColor: "#1c0b0b",
    gradientColor1: "#1c0b0b",
    gradientColor2: "#9f1239",
    gradientDirection: "135deg",

    buttonColor: "#fb7185",
    buttonTextColor: "#ffffff",

    font: "Inter",
    buttonStyle: "rounded",
    buttonShadow: true,

    pageWidth: "normal",
    spacing: "normal",
    headerPosition: "center",

    starterHeading: "Something new is coming",
  },
];

const luxuryTemplateIds = new Set<Category>([
  "atelier",
  "noir",
  "sage",
  "oxblood",
  "midnight",
]);

function isLuxuryTemplate(id: Category) {
  return luxuryTemplateIds.has(id);
}

function categoryFromHomepageTheme(
  themeId?: string
): Category {
  switch (themeId) {
    case "atelier":
      return "atelier";

    case "noir":
      return "noir";

    case "sage":
      return "sage";

    case "oxblood":
      return "oxblood";

    case "midnight":
      return "midnight";

    case "mono":
      return "minimal";

    case "blue":
      return "portfolio";

    case "rose":
      return "creator";

    case "sunset":
      return "launch";

    case "violet":
      return "creator";

    default:
      return "atelier";
  }
}

function sanitizeUsername(value: string) {
  return value
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9_]/g, "");
}

export default function OnboardingPage() {
  const router = useRouter();

  const [step, setStep] = useState(1);

  const [loading, setLoading] = useState(true);
  const [finishing, setFinishing] = useState(false);

  const [uploadingAvatar, setUploadingAvatar] =
    useState(false);

  const [finishError, setFinishError] =
    useState("");

  const [existingSite, setExistingSite] =
    useState<ExistingSite | null>(null);

  const [homepageDraft, setHomepageDraft] =
    useState<HomepageDraft | null>(null);

  const [
    homepageDraftApplied,
    setHomepageDraftApplied,
  ] = useState(false);

  const [username, setUsername] = useState("");

  const [
    usernameStatus,
    setUsernameStatus,
  ] = useState<
    "idle" | "checking" | "available" | "taken"
  >("idle");

  const [displayName, setDisplayName] =
    useState("");

  const [category, setCategory] =
    useState<Category>("atelier");

  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  const [instagramUrl, setInstagramUrl] =
    useState("");

  const [youtubeUrl, setYoutubeUrl] =
    useState("");

  const [xUrl, setXUrl] = useState("");

  const [
    firstLinkTitle,
    setFirstLinkTitle,
  ] = useState("");

  const [
    firstLinkUrl,
    setFirstLinkUrl,
  ] = useState("");

  const selectedTemplate = useMemo(() => {
    return (
      templates.find(
        (template) =>
          template.id === category
      ) || templates[0]
    );
  }, [category]);

  const luxuryTemplates = useMemo(
    () =>
      templates.filter((template) =>
        isLuxuryTemplate(template.id)
      ),
    []
  );

  const creatorTemplates = useMemo(
    () =>
      templates.filter(
        (template) =>
          !isLuxuryTemplate(template.id)
      ),
    []
  );

  useEffect(() => {
    try {
      const savedStep =
        window.sessionStorage.getItem(
          "onboarding-step"
        );

      if (savedStep) {
        const parsed =
          Number(savedStep);

        if (
          parsed >= 1 &&
          parsed <= 4
        ) {
          setStep(parsed);
        }
      }
    } catch (error) {
      console.error(
        "COULD NOT LOAD ONBOARDING STEP:",
        error
      );
    }
  }, []);

  useEffect(() => {
    try {
      window.sessionStorage.setItem(
        "onboarding-step",
        String(step)
      );
    } catch (error) {
      console.error(
        "COULD NOT SAVE ONBOARDING STEP:",
        error
      );
    }
  }, [step]);

  useEffect(() => {
    async function initialize() {
      let draft: HomepageDraft | null =
        null;

      try {
        const rawDraft =
          window.localStorage.getItem(
            HOMEPAGE_DRAFT_KEY
          );

        if (rawDraft) {
          const parsed =
            JSON.parse(
              rawDraft
            ) as HomepageDraft;

          const draftAge =
            Date.now() -
            Number(
              parsed.createdAt || 0
            );

          if (
            parsed.version === 1 &&
            draftAge >= 0 &&
            draftAge <=
              HOMEPAGE_DRAFT_MAX_AGE
          ) {
            draft = parsed;
            setHomepageDraft(parsed);
          } else {
            window.localStorage.removeItem(
              HOMEPAGE_DRAFT_KEY
            );
          }
        }
      } catch (error) {
        console.error(
          "COULD NOT LOAD HOMEPAGE DRAFT:",
          error
        );
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push(
          "/login?next=/onboarding"
        );
        return;
      }

      const {
        data: currentSite,
        error: currentSiteError,
      } = await supabase
        .from("sites")
        .select("id, username")
        .eq("user_id", user.id)
        .maybeSingle();

      if (currentSiteError) {
        console.error(
          "CURRENT SITE CHECK ERROR:",
          currentSiteError
        );
      }

      if (currentSite) {
        setExistingSite(
          currentSite as ExistingSite
        );

        try {
          window.sessionStorage.removeItem(
            "onboarding-step"
          );

          window.localStorage.removeItem(
            HOMEPAGE_DRAFT_KEY
          );

          window.localStorage.removeItem(
            "musepage-post-login-redirect"
          );
        } catch (storageError) {
          console.error(
            "COULD NOT CLEAR CLAIM ROUTING STORAGE:",
            storageError
          );
        }

        router.replace("/dashboard");
        return;
      }

      if (draft) {
        const draftUsername =
          sanitizeUsername(
            draft.username || ""
          );

        if (draftUsername) {
          setUsername(
            draftUsername
          );
        }

        if (
          draft.displayName?.trim()
        ) {
          setDisplayName(
            draft.displayName.trim()
          );
        }

        if (draft.bio?.trim()) {
          setBio(
            draft.bio.trim()
          );
        }

        if (
          draft.firstLinkTitle?.trim()
        ) {
          setFirstLinkTitle(
            draft.firstLinkTitle.trim()
          );
        }

        if (draft.theme?.id) {
          setCategory(
            categoryFromHomepageTheme(
              draft.theme.id
            )
          );
        }

        setHomepageDraftApplied(true);
        setStep(1);

        try {
          window.sessionStorage.setItem(
            "onboarding-step",
            "1"
          );
        } catch {
          // No-op.
        }
      }

      setLoading(false);
    }

    initialize();
  }, [router]);

  useEffect(() => {
    if (!username.trim()) {
      setUsernameStatus("idle");
      return;
    }

    const normalized =
      username.trim().toLowerCase();

    if (
      normalized.length < 3 ||
      !/^[a-z0-9_]+$/.test(
        normalized
      )
    ) {
      setUsernameStatus("idle");
      return;
    }

    const timeout =
      setTimeout(async () => {
        setUsernameStatus(
          "checking"
        );

        let query = supabase
          .from("sites")
          .select("id")
          .eq(
            "username",
            normalized
          );

        if (existingSite?.id) {
          query = query.neq(
            "id",
            existingSite.id
          );
        }

        const {
          data,
          error,
        } = await query.maybeSingle();

        if (error) {
          console.error(
            "USERNAME CHECK ERROR:",
            error
          );

          setUsernameStatus("idle");
          return;
        }

        setUsernameStatus(
          data
            ? "taken"
            : "available"
        );
      }, 450);

    return () =>
      clearTimeout(timeout);
  }, [
    username,
    existingSite?.id,
  ]);

  function nextFromUsername() {
    if (
      username.trim().length < 3
    ) {
      alert(
        "Username must be at least 3 characters."
      );
      return;
    }

    if (
      !/^[a-z0-9_]+$/.test(
        username
      )
    ) {
      alert(
        "Username can only contain lowercase letters, numbers and underscores."
      );
      return;
    }

    if (
      usernameStatus === "taken"
    ) {
      alert(
        "That username is already taken."
      );
      return;
    }

    if (
      usernameStatus ===
      "checking"
    ) {
      return;
    }

    setStep(2);
  }

  function normalizeUrl(
    value: string
  ) {
    const trimmed =
      value.trim();

    if (!trimmed) {
      return "";
    }

    if (
      trimmed.startsWith(
        "http://"
      ) ||
      trimmed.startsWith(
        "https://"
      ) ||
      trimmed.startsWith(
        "mailto:"
      )
    ) {
      return trimmed;
    }

    return `https://${trimmed}`;
  }

  async function uploadAvatar(
    file: File
  ) {
    if (
      !file.type.startsWith(
        "image/"
      )
    ) {
      alert(
        "Please choose an image file."
      );
      return;
    }

    if (
      file.size >
      10 * 1024 * 1024
    ) {
      alert(
        "Image must be smaller than 10MB."
      );
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push(
        "/login?next=/onboarding"
      );
      return;
    }

    const extension =
      file.name
        .split(".")
        .pop() || "jpg";

    const fileName = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2)}.${extension}`;

    const path =
      `avatars/${user.id}/${fileName}`;

    try {
      setUploadingAvatar(true);

      const { error } =
        await supabase.storage
          .from("site-assets")
          .upload(
            path,
            file,
            {
              cacheControl:
                "3600",
              upsert: false,
              contentType:
                file.type,
            }
          );

      if (error) {
        console.error(
          "AVATAR UPLOAD ERROR:",
          error
        );

        alert(error.message);
        return;
      }

      const { data } =
        supabase.storage
          .from("site-assets")
          .getPublicUrl(path);

      setAvatarUrl(
        data.publicUrl
      );
    } catch (error) {
      console.error(
        "AVATAR UPLOAD ERROR:",
        error
      );

      alert(
        "Could not upload your profile picture."
      );
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function removeAvatar() {
    if (!avatarUrl) {
      return;
    }

    try {
      const marker =
        "/storage/v1/object/public/site-assets/";

      const index =
        avatarUrl.indexOf(
          marker
        );

      if (index !== -1) {
        const path =
          avatarUrl.substring(
            index +
              marker.length
          );

        const { error } =
          await supabase.storage
            .from("site-assets")
            .remove([path]);

        if (error) {
          console.error(
            "AVATAR DELETE ERROR:",
            error
          );
        }
      }
    } catch (error) {
      console.error(
        "AVATAR DELETE ERROR:",
        error
      );
    }

    setAvatarUrl("");
  }

  async function finishOnboarding() {
    if (
      finishing ||
      uploadingAvatar
    ) {
      return;
    }

    setFinishError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push(
        "/login?next=/onboarding"
      );
      return;
    }

    setFinishing(true);

    try {
      const normalizedUsername =
        username
          .trim()
          .toLowerCase();

      const finalDisplayName =
        displayName.trim() ||
        normalizedUsername;

      const { error: profileError } =
        await supabase
          .from("profiles")
          .upsert(
            {
              id: user.id,

              username:
                normalizedUsername,

              display_name:
                finalDisplayName,

              bio:
                bio.trim() ||
                null,
            },
            {
              onConflict: "id",
            }
          );

      if (profileError) {
        throw new Error(
          `Profile setup failed: ${profileError.message}`
        );
      }

      const template =
        selectedTemplate;

      const sitePayload = {
        user_id: user.id,

        username:
          normalizedUsername,

        bio:
          bio.trim() ||
          null,

        avatar_url:
          avatarUrl.trim() ||
          null,

        instagram_url:
          normalizeUrl(
            instagramUrl
          ) || null,

        youtube_url:
          normalizeUrl(
            youtubeUrl
          ) || null,

        x_url:
          normalizeUrl(
            xUrl
          ) || null,

        background_color:
          template.backgroundColor,

        button_color:
          template.buttonColor,

        button_text_color:
          template.buttonTextColor,

        font:
          template.font,

        button_style:
          template.buttonStyle,

        button_shadow:
          template.buttonShadow,

        page_width:
          template.pageWidth,

        spacing:
          template.spacing,

        header_position:
          template.headerPosition,

        background_type:
          template.backgroundType,

        gradient_color_1:
          template.gradientColor1,

        gradient_color_2:
          template.gradientColor2,

        gradient_direction:
          template.gradientDirection,

        background_image_url:
          null,

        background_overlay: 0,

        background_position:
          "center",

        allow_indexing: true,
      };

      /*
       * Only completely new MusePage sites
       * receive the welcome email.
       */
      const isNewSite =
        !existingSite;

      let siteId =
        existingSite?.id || "";

      if (existingSite) {
        const { error } =
          await supabase
            .from("sites")
            .update(sitePayload)
            .eq(
              "id",
              existingSite.id
            );

        if (error) {
          throw error;
        }
      } else {
        const {
          data,
          error,
        } = await supabase
          .from("sites")
          .insert(sitePayload)
          .select("id")
          .single();

        if (error) {
          throw error;
        }

        siteId = data.id;
      }

      if (!siteId) {
        throw new Error(
          "Site could not be created."
        );
      }

      const {
        data: existingLinks,
        error: linksError,
      } = await supabase
        .from("links")
        .select(
          "id, position"
        )
        .eq(
          "site_id",
          siteId
        )
        .order(
          "position",
          {
            ascending: false,
          }
        );

      if (linksError) {
        console.error(
          "LOAD EXISTING LINKS ERROR:",
          linksError
        );
      }

      let nextPosition =
        existingLinks &&
        existingLinks.length > 0
          ? (existingLinks[0]
              .position || 0) +
            1
          : 0;

      const newBlocks:
        Record<
          string,
          unknown
        >[] = [];

      if (
        (!existingLinks ||
          existingLinks.length === 0) &&
        template.starterHeading
      ) {
        newBlocks.push({
          site_id: siteId,

          type: "heading",

          title:
            template.starterHeading,

          url: "",

          active: true,

          position:
            nextPosition++,

          featured: false,
        });
      }

      if (
        firstLinkTitle.trim() &&
        firstLinkUrl.trim()
      ) {
        newBlocks.push({
          site_id: siteId,

          type: "link",

          title:
            firstLinkTitle.trim(),

          url:
            normalizeUrl(
              firstLinkUrl
            ),

          active: true,

          position:
            nextPosition++,

          featured: false,

          open_new_tab: true,
        });
      }

      if (
        newBlocks.length > 0
      ) {
        const {
          error:
            insertBlocksError,
        } = await supabase
          .from("links")
          .insert(
            newBlocks
          );

        if (
          insertBlocksError
        ) {
          throw insertBlocksError;
        }
      }

      const [
        {
          data:
            verifiedProfile,

          error:
            verifyProfileError,
        },

        {
          data:
            verifiedSite,

          error:
            verifySiteError,
        },
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select(
            "id, username"
          )
          .eq(
            "id",
            user.id
          )
          .maybeSingle(),

        supabase
          .from("sites")
          .select(
            "id, username"
          )
          .eq(
            "user_id",
            user.id
          )
          .maybeSingle(),
      ]);

      if (
        verifyProfileError
      ) {
        throw new Error(
          `Profile verification failed: ${verifyProfileError.message}`
        );
      }

      if (
        verifySiteError
      ) {
        throw new Error(
          `Site verification failed: ${verifySiteError.message}`
        );
      }

      if (
        !verifiedProfile?.id
      ) {
        throw new Error(
          "Your profile could not be verified after saving."
        );
      }

      if (
        !verifiedSite?.id
      ) {
        throw new Error(
          "Your page could not be verified after saving."
        );
      }

      /*
       * ─────────────────────────────────────────
       * MUSEPAGE WELCOME EMAIL
       * ─────────────────────────────────────────
       *
       * Email is deliberately secondary.
       *
       * If Resend/API email delivery fails,
       * onboarding STILL succeeds.
       */
      if (
        isNewSite &&
        user.email
      ) {
        try {
          const pageUrl =
            `${window.location.origin}/${normalizedUsername}`;

          const emailResponse =
            await fetch(
              "/api/send-welcome-email",
              {
                method: "POST",

                headers: {
                  "Content-Type":
                    "application/json",
                },

                body: JSON.stringify({
                  email:
                    user.email,

                  displayName:
                    finalDisplayName,

                  username:
                    normalizedUsername,

                  pageUrl,

                  template:
                    template.name,
                }),
              }
            );

          if (
            !emailResponse.ok
          ) {
            const emailError =
              await emailResponse
                .json()
                .catch(
                  () => null
                );

            console.error(
              "WELCOME EMAIL FAILED:",
              emailError
            );
          } else {
            console.log(
              "✦ MusePage welcome email sent"
            );
          }
        } catch (
          emailError
        ) {
          console.error(
            "WELCOME EMAIL ERROR:",
            emailError
          );
        }
      }

      try {
        window.sessionStorage.removeItem(
          "onboarding-step"
        );

        window.localStorage.removeItem(
          HOMEPAGE_DRAFT_KEY
        );

        window.localStorage.removeItem(
          "musepage-post-login-redirect"
        );
      } catch (error) {
        console.error(
          "COULD NOT CLEAR ONBOARDING STORAGE:",
          error
        );
      }

      window.location.href =
        "/dashboard";
    } catch (error) {
      console.error(
        "ONBOARDING ERROR:",
        error
      );

      const message =
        error instanceof Error
          ? error.message
          : "Something went wrong while setting up your page.";

      setFinishError(
        message
      );

      alert(message);
    } finally {
      setFinishing(false);
    }
  }

  function skipOnboarding() {
    router.push(
      "/dashboard"
    );
  }

  function TemplateCard({
    template,
  }: {
    template: Template;
  }) {
    const selected =
      category === template.id;

    return (
      <button
        type="button"
        onClick={() =>
          setCategory(
            template.id
          )
        }
        className={`group overflow-hidden rounded-[18px] border text-left transition duration-200 ${
          selected
            ? "border-[#B79155] bg-[#FBF8F2] shadow-[0_16px_38px_rgba(70,54,35,0.08)]"
            : "border-[#D9D1C6] bg-[#FBF9F5] hover:-translate-y-0.5 hover:border-[#C8B99F]"
        }`}
      >
        <div
          className="relative h-28 overflow-hidden p-4"
          style={{
            background:
              template.preview,
          }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_10%,rgba(255,255,255,0.23),transparent_34%)]" />

          <div className="relative flex h-full items-end justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-[11px] border border-white/15 bg-black/15 font-serif text-lg text-white/85 backdrop-blur">
              {template.symbol}
            </div>

            <span className="rounded-full border border-white/15 bg-black/15 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-white/80 backdrop-blur">
              {template.eyebrow}
            </span>
          </div>
        </div>

        <div className="p-4">
          <div className="flex items-center justify-between gap-3">
            <p
              className="text-[17px] text-[#28241F]"
              style={{
                fontFamily:
                  'Georgia, "Times New Roman", serif',
              }}
            >
              {template.name}
            </p>

            <div className="flex -space-x-1">
              {[
                template.gradientColor1,
                template.gradientColor2,
                template.buttonColor,
              ].map(
                (
                  color,
                  index
                ) => (
                  <span
                    key={`${color}-${index}`}
                    className="h-4 w-4 rounded-full border-2 border-[#FBF9F5]"
                    style={{
                      backgroundColor:
                        color,
                    }}
                  />
                )
              )}
            </div>
          </div>

          <p className="mt-1.5 text-xs leading-5 text-[#847A6E]">
            {template.description}
          </p>

          {selected && (
            <div className="mt-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9B7442]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#B79155]" />
              Selected
            </div>
          )}
        </div>
      </button>
    );
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F4F1EB] text-[#1C1A17]">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-[#D8D0C4] border-t-[#B79155]" />

          <p className="mt-4 text-sm text-[#847A6E]">
            Preparing your page...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#F4F1EB] text-[#1C1A17]">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0"
      >
        <div className="absolute -right-32 top-10 h-[420px] w-[420px] rounded-full bg-[#DCC7A6]/25 blur-[90px]" />

        <div className="absolute -left-32 bottom-0 h-[360px] w-[360px] rounded-full bg-[#B9C5B4]/20 blur-[90px]" />

        <div className="absolute left-[28%] top-[-220px] h-[500px] w-[500px] rounded-full bg-white/70 blur-[100px]" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-5 py-7 sm:px-7 lg:px-9">
        <div className="flex items-center justify-between gap-4">
          <MusePageLogo />

          <button
            type="button"
            onClick={
              skipOnboarding
            }
            className="rounded-[9px] border border-[#D7CEC2] bg-[#FBF9F5]/80 px-3.5 py-2 text-xs font-medium text-[#766D62] backdrop-blur transition hover:border-[#C7B79E] hover:bg-white hover:text-[#26221E]"
          >
            Skip setup
          </button>
        </div>

        <div className="mx-auto mt-10 w-full max-w-4xl pb-16">
          {homepageDraftApplied && (
            <div className="mb-7 overflow-hidden rounded-[18px] border border-[#D5C3A8] bg-[#FBF8F2]/88 shadow-[0_14px_34px_rgba(70,54,35,0.04)] backdrop-blur">
              <div className="flex items-start gap-4 p-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border border-[#D3BF9F] bg-[#EEE3D2] font-serif text-lg text-[#9A7442]">
                  M
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#3A342D]">
                    Your homepage design came with you
                  </p>

                  <p className="mt-1 text-xs leading-5 text-[#82786C]">
                    {homepageDraft?.theme?.name
                      ? `${homepageDraft.theme.name} is already selected.`
                      : "Your homepage draft is ready."}{" "}
                    Confirm the details below and MusePage will create the real
                    page with the complete preset.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="mb-10">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#9B7442]">
                Step {step} of 4
              </p>

              <p className="text-xs text-[#9A9185]">
                {Math.round(
                  (step / 4) *
                    100
                )}
                %
              </p>
            </div>

            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#DED6CB]">
              <div
                className="h-full rounded-full bg-[#B79155] transition-all duration-500"
                style={{
                  width: `${
                    (step / 4) *
                    100
                  }%`,
                }}
              />
            </div>
          </div>

          {step === 1 && (
            <section>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#9B7442]">
                Your page
              </p>

              <h1
                className="mt-4 max-w-2xl text-3xl leading-[1.1] font-normal tracking-[-0.045em] text-[#201D19] sm:text-4xl md:text-5xl lg:text-6xl sm:leading-[1.05]"
                style={{
                  fontFamily:
                    'Georgia, "Times New Roman", serif',
                }}
              >
                Claim your corner of the internet.
              </h1>

              <p className="mt-4 max-w-xl text-sm leading-6 text-[#756D62]">
                Choose the address people will use to find your MusePage.
              </p>

              <div className="mt-8 rounded-[20px] border border-[#D9D1C6] bg-[#FBF9F5]/88 p-5 shadow-[0_16px_40px_rgba(70,54,35,0.04)] backdrop-blur sm:p-6">
                <label className="text-xs font-semibold text-[#554F47]">
                  Username
                </label>

                <div className="mt-3 flex items-center rounded-[12px] border border-[#D8D0C4] bg-white/80 px-3 sm:px-4 transition focus-within:border-[#B79155] focus-within:ring-4 focus-within:ring-[#B79155]/10">
                  <span className="shrink-0 text-sm text-[#A09689]">
                    musepage.app/
                  </span>

                  <input
                    value={username}
                    onChange={(e) =>
                      setUsername(
                        sanitizeUsername(
                          e.target
                            .value
                        )
                      )
                    }
                    placeholder="username"
                    maxLength={30}
                    className="min-w-0 flex-1 bg-transparent px-1 py-4 text-base sm:text-sm text-[#28241F] outline-none"
                  />
                </div>

                <div className="mt-3 min-h-5 text-xs">
                  {usernameStatus ===
                    "checking" && (
                    <span className="text-[#8A8175]">
                      Checking availability...
                    </span>
                  )}

                  {usernameStatus ===
                    "available" && (
                    <span className="text-[#6F8D68]">
                      ✓ Username available
                    </span>
                  )}

                  {usernameStatus ===
                    "taken" && (
                    <span className="text-[#A66A5F]">
                      This username is already taken.
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-7 flex justify-end">
                <button
                  type="button"
                  onClick={
                    nextFromUsername
                  }
                  disabled={
                    !username ||
                    usernameStatus ===
                      "taken" ||
                    usernameStatus ===
                      "checking"
                  }
                  className="rounded-[10px] bg-[#9B7442] px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(155,116,66,0.18)] transition hover:bg-[#876538] hover:shadow-[0_14px_28px_rgba(155,116,66,0.24)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Continue →
                </button>
              </div>
            </section>
          )}

          {step === 2 && (
            <section>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#9B7442]">
                Choose your direction
              </p>

              <h1
                className="mt-4 text-3xl leading-[1.1] font-normal tracking-[-0.045em] text-[#201D19] sm:text-4xl md:text-5xl lg:text-6xl sm:leading-[1.05]"
                style={{
                  fontFamily:
                    'Georgia, "Times New Roman", serif',
                }}
              >
                Begin with a point of view.
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-6 text-[#756D62]">
                Pick a complete preset. Every choice controls the real page:
                colors, typography, button treatment, width, spacing and
                alignment.
              </p>

              {homepageDraft?.theme && (
                <div className="mt-6 flex items-center gap-4 rounded-[16px] border border-[#D5C3A8] bg-[#FBF8F2]/80 p-4">
                  <div
                    className="h-11 w-11 shrink-0 rounded-full border-2 border-white shadow-sm"
                    style={{
                      background: `linear-gradient(135deg, ${homepageDraft.theme.accent}, ${homepageDraft.theme.accent2})`,
                    }}
                  />

                  <div>
                    <p className="text-sm font-semibold text-[#39342E]">
                      {homepageDraft.theme.name} selected on the homepage
                    </p>

                    <p className="mt-1 text-xs text-[#83796D]">
                      It has been mapped to the matching full MusePage preset.
                    </p>
                  </div>
                </div>
              )}

              <div className="mt-9">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold text-[#3E3933]">
                      Luxury collection
                    </p>

                    <p className="mt-1 text-xs text-[#8A8175]">
                      The same five directions shown in the homepage builder.
                    </p>
                  </div>

                  <span className="text-[9px] font-semibold uppercase tracking-[0.17em] text-[#A28E70]">
                    MusePage signature
                  </span>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {luxuryTemplates.map(
                    (template) => (
                      <TemplateCard
                        key={
                          template.id
                        }
                        template={
                          template
                        }
                      />
                    )
                  )}
                </div>
              </div>

              <div className="mt-10 border-t border-[#D9D1C6] pt-8">
                <p className="text-xs font-semibold text-[#3E3933]">
                  Creator presets
                </p>

                <p className="mt-1 text-xs text-[#8A8175]">
                  Existing MusePage starting points remain available.
                </p>

                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {creatorTemplates.map(
                    (template) => (
                      <TemplateCard
                        key={
                          template.id
                        }
                        template={
                          template
                        }
                      />
                    )
                  )}
                </div>
              </div>

              <div className="mt-8 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() =>
                    setStep(1)
                  }
                  className="rounded-[10px] px-5 py-3 text-sm text-[#71695F] transition hover:bg-white/60 hover:text-[#27231F]"
                >
                  ← Back
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setStep(3)
                  }
                  className="rounded-[10px] bg-[#9B7442] px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(155,116,66,0.18)] transition hover:bg-[#876538] hover:shadow-[0_14px_28px_rgba(155,116,66,0.24)]"
                >
                  Continue →
                </button>
              </div>
            </section>
          )}

          {step === 3 && (
            <section>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#9B7442]">
                Introduce yourself
              </p>

              <h1
                className="mt-4 text-3xl leading-[1.1] font-normal tracking-[-0.045em] text-[#201D19] sm:text-4xl md:text-5xl lg:text-6xl sm:leading-[1.05]"
                style={{
                  fontFamily:
                    'Georgia, "Times New Roman", serif',
                }}
              >
                Give the page a person.
              </h1>

              <p className="mt-4 text-sm text-[#756D62]">
                Everything here can be changed later from Customize.
              </p>

              <div className="mt-8 space-y-6 rounded-[20px] border border-[#D9D1C6] bg-[#FBF9F5]/88 p-5 shadow-[0_16px_40px_rgba(70,54,35,0.04)] backdrop-blur sm:p-6">
                <div>
                  <label className="mb-3 block text-xs font-semibold text-[#554F47]">
                    Profile picture
                  </label>

                  <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                    {avatarUrl ? (
                      <img
                        src={
                          avatarUrl
                        }
                        alt="Profile preview"
                        className="h-24 w-24 shrink-0 rounded-full object-cover ring-4 ring-[#E7DED1]"
                      />
                    ) : (
                      <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border border-[#D9C7A9] bg-[#EEE5D7] font-serif text-3xl text-[#9B7442] ring-4 ring-[#F2ECE3]">
                        {displayName
                          .trim()
                          .charAt(
                            0
                          )
                          .toUpperCase() ||
                          "M"}
                      </div>
                    )}

                    <div className="flex-1">
                      <label
                        className={`flex cursor-pointer items-center justify-center rounded-[10px] border px-5 py-3 text-sm font-medium transition ${
                          uploadingAvatar
                            ? "cursor-wait border-[#D9D1C6] bg-[#F2EEE7] text-[#9A9185]"
                            : "border-[#D8D0C4] bg-white/75 text-[#5F584F] hover:border-[#C7B79E] hover:bg-white"
                        }`}
                      >
                        {uploadingAvatar
                          ? "Uploading..."
                          : avatarUrl
                            ? "Change photo"
                            : "Choose photo"}

                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          disabled={
                            uploadingAvatar
                          }
                          className="hidden"
                          onChange={(
                            e
                          ) => {
                            const file =
                              e
                                .target
                                .files?.[0];

                            if (
                              file
                            ) {
                              uploadAvatar(
                                file
                              );
                            }

                            e.currentTarget.value =
                              "";
                          }}
                        />
                      </label>

                      <p className="mt-2 text-xs leading-5 text-[#9A9185]">
                        JPG, PNG or WEBP • Maximum 10MB
                      </p>

                      {avatarUrl && (
                        <button
                          type="button"
                          onClick={
                            removeAvatar
                          }
                          disabled={
                            uploadingAvatar
                          }
                          className="mt-2 text-xs font-medium text-[#A66A5F] transition hover:text-[#8E554B] disabled:opacity-50"
                        >
                          Remove photo
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold text-[#554F47]">
                    Display name
                  </label>

                  <input
                    value={
                      displayName
                    }
                    onChange={(e) =>
                      setDisplayName(
                        e.target
                          .value
                      )
                    }
                    placeholder="Your name"
                    maxLength={60}
                    className="w-full rounded-[11px] border border-[#D8D0C4] bg-white/75 px-4 py-3 text-base sm:text-sm outline-none transition focus:border-[#B79155] focus:ring-4 focus:ring-[#B79155]/10"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold text-[#554F47]">
                    Bio
                  </label>

                  <textarea
                    value={bio}
                    onChange={(e) =>
                      setBio(
                        e.target
                          .value
                      )
                    }
                    placeholder="Creator, founder, student, artist..."
                    rows={4}
                    maxLength={220}
                    className="w-full resize-none rounded-[11px] border border-[#D8D0C4] bg-white/75 px-4 py-3 text-base sm:text-sm outline-none transition focus:border-[#B79155] focus:ring-4 focus:ring-[#B79155]/10"
                  />

                  <p className="mt-2 text-right text-xs text-[#A09689]">
                    {bio.length}/220
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <input
                    value={
                      instagramUrl
                    }
                    onChange={(e) =>
                      setInstagramUrl(
                        e.target
                          .value
                      )
                    }
                    placeholder="Instagram"
                    className="rounded-[11px] border border-[#D8D0C4] bg-white/75 px-4 py-3 text-base sm:text-sm outline-none transition focus:border-[#B79155] focus:ring-4 focus:ring-[#B79155]/10"
                  />

                  <input
                    value={
                      youtubeUrl
                    }
                    onChange={(e) =>
                      setYoutubeUrl(
                        e.target
                          .value
                      )
                    }
                    placeholder="YouTube"
                    className="rounded-[11px] border border-[#D8D0C4] bg-white/75 px-4 py-3 text-base sm:text-sm outline-none transition focus:border-[#B79155] focus:ring-4 focus:ring-[#B79155]/10"
                  />

                  <input
                    value={xUrl}
                    onChange={(e) =>
                      setXUrl(
                        e.target
                          .value
                      )
                    }
                    placeholder="X / Twitter"
                    className="rounded-[11px] border border-[#D8D0C4] bg-white/75 px-4 py-3 text-base sm:text-sm outline-none transition focus:border-[#B79155] focus:ring-4 focus:ring-[#B79155]/10"
                  />
                </div>
              </div>

              <div className="mt-7 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() =>
                    setStep(2)
                  }
                  disabled={
                    uploadingAvatar
                  }
                  className="rounded-[10px] px-5 py-3 text-sm text-[#71695F] hover:bg-white/60 hover:text-[#27231F] disabled:opacity-50"
                >
                  ← Back
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setStep(4)
                  }
                  disabled={
                    uploadingAvatar
                  }
                  className="rounded-[10px] bg-[#9B7442] px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(155,116,66,0.18)] transition hover:bg-[#876538] hover:shadow-[0_14px_28px_rgba(155,116,66,0.24)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {uploadingAvatar
                    ? "Uploading photo..."
                    : "Continue →"}
                </button>
              </div>
            </section>
          )}

          {step === 4 && (
            <section>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#9B7442]">
                Final step
              </p>

              <h1
                className="mt-4 text-3xl leading-[1.1] font-normal tracking-[-0.045em] text-[#201D19] sm:text-4xl md:text-5xl lg:text-6xl sm:leading-[1.05]"
                style={{
                  fontFamily:
                    'Georgia, "Times New Roman", serif',
                }}
              >
                Give people somewhere to go.
              </h1>

              <p className="mt-4 text-sm leading-6 text-[#756D62]">
                Your first link is optional. You can add every other block from
                the dashboard later.
              </p>

              <div className="mt-8 rounded-[20px] border border-[#D9D1C6] bg-[#FBF9F5]/88 p-5 shadow-[0_16px_40px_rgba(70,54,35,0.04)] backdrop-blur sm:p-6">
                <div>
                  <label className="mb-2 block text-xs font-semibold text-[#554F47]">
                    Link title
                  </label>

                  <input
                    value={
                      firstLinkTitle
                    }
                    onChange={(e) =>
                      setFirstLinkTitle(
                        e.target
                          .value
                      )
                    }
                    placeholder="My latest project"
                    className="w-full rounded-[11px] border border-[#D8D0C4] bg-white/75 px-4 py-3 text-base sm:text-sm outline-none transition focus:border-[#B79155] focus:ring-4 focus:ring-[#B79155]/10"
                  />

                  {homepageDraft?.firstLinkTitle &&
                    firstLinkTitle && (
                      <p className="mt-2 text-xs text-[#9B7442]">
                        ✓ Carried over from your homepage demo
                      </p>
                    )}
                </div>

                <div className="mt-5">
                  <label className="mb-2 block text-xs font-semibold text-[#554F47]">
                    URL
                  </label>

                  <input
                    value={
                      firstLinkUrl
                    }
                    onChange={(e) =>
                      setFirstLinkUrl(
                        e.target
                          .value
                      )
                    }
                    placeholder="https://..."
                    className="w-full rounded-[11px] border border-[#D8D0C4] bg-white/75 px-4 py-3 text-base sm:text-sm outline-none transition focus:border-[#B79155] focus:ring-4 focus:ring-[#B79155]/10"
                  />
                </div>
              </div>

              <div className="mt-8 overflow-hidden rounded-[20px] border border-[#D3C2A6] bg-[#FBF8F2] shadow-[0_16px_42px_rgba(70,54,35,0.05)]">
                <div
                  className="h-24"
                  style={{
                    background:
                      selectedTemplate.preview,
                  }}
                />

                <div className="p-5 sm:p-6">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#9B7442]">
                    Your setup
                  </p>

                  <div className="mt-5 flex items-center gap-4">
                    {avatarUrl ? (
                      <img
                        src={
                          avatarUrl
                        }
                        alt=""
                        className="h-14 w-14 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#D6C4A5] bg-[#EEE5D7] font-serif text-xl text-[#9B7442]">
                        {displayName
                          .trim()
                          .charAt(
                            0
                          )
                          .toUpperCase() ||
                          "M"}
                      </div>
                    )}

                    <div className="min-w-0">
                      <p className="truncate font-semibold text-[#302B26]">
                        {displayName.trim() ||
                          `@${username}`}
                      </p>

                      <p className="mt-1 text-sm text-[#81776B]">
                        @{username}
                      </p>

                      <p className="mt-1 text-xs font-medium text-[#9B7442]">
                        {selectedTemplate.name} · {selectedTemplate.eyebrow}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-1.5 sm:gap-2">
                    <div className="rounded-[10px] border border-[#DED4C7] bg-white/60 p-3">
                      <p className="text-[9px] uppercase tracking-[0.12em] text-[#A09689]">
                        Type
                      </p>

                      <p className="mt-1 min-w-0 truncate text-xs font-semibold text-[#4B443C]">
                        {selectedTemplate.font}
                      </p>
                    </div>

                    <div className="rounded-[10px] border border-[#DED4C7] bg-white/60 p-3">
                      <p className="text-[9px] uppercase tracking-[0.12em] text-[#A09689]">
                        Width
                      </p>

                      <p className="mt-1 min-w-0 truncate text-xs font-semibold capitalize text-[#4B443C]">
                        {selectedTemplate.pageWidth}
                      </p>
                    </div>

                    <div className="rounded-[10px] border border-[#DED4C7] bg-white/60 p-3">
                      <p className="text-[9px] uppercase tracking-[0.12em] text-[#A09689]">
                        Layout
                      </p>

                      <p className="mt-1 min-w-0 truncate text-xs font-semibold capitalize text-[#4B443C]">
                        {selectedTemplate.headerPosition}
                      </p>
                    </div>
                  </div>

                  {homepageDraft?.theme && (
                    <div className="mt-4 flex items-center gap-3 rounded-[11px] border border-[#DED4C7] bg-white/55 p-3">
                      <div
                        className="h-8 w-8 rounded-full"
                        style={{
                          background: `linear-gradient(135deg, ${homepageDraft.theme.accent}, ${homepageDraft.theme.accent2})`,
                        }}
                      />

                      <div>
                        <p className="text-xs font-medium text-[#4A433B]">
                          Claimed from {homepageDraft.theme.name}
                        </p>

                        <p className="mt-0.5 text-[11px] text-[#8D8377]">
                          MusePage will save the complete matching preset, not
                          just these two colors.
                        </p>
                      </div>
                    </div>
                  )}

                  {bio && (
                    <p className="mt-5 text-sm leading-6 text-[#736A60]">
                      {bio}
                    </p>
                  )}
                </div>
              </div>

              {finishError && (
                <div className="mt-6 rounded-[15px] border border-[#D7B8B0] bg-[#F2E4E0] p-4">
                  <p className="text-sm font-semibold text-[#945F55]">
                    Could not finish setup
                  </p>

                  <p className="mt-2 text-sm leading-6 text-[#9A675E]">
                    {finishError}
                  </p>
                </div>
              )}

              <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={() =>
                    setStep(3)
                  }
                  disabled={
                    finishing
                  }
                  className="w-full sm:w-auto text-center rounded-[10px] px-5 py-3 text-sm text-[#71695F] hover:bg-white/60 hover:text-[#27231F] disabled:opacity-50"
                >
                  ← Back
                </button>

                <button
                  type="button"
                  onClick={
                    finishOnboarding
                  }
                  disabled={
                    finishing ||
                    uploadingAvatar
                  }
                  className="w-full sm:w-auto text-center rounded-[10px] bg-[#9B7442] px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(155,116,66,0.18)] transition hover:bg-[#876538] hover:shadow-[0_14px_28px_rgba(155,116,66,0.24)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {finishing
                    ? "Building your page..."
                    : `Build my ${selectedTemplate.name} page`}
                </button>
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}