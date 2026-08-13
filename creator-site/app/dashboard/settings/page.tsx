"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type AccountInfo = {
  email: string;
  provider: string;
  canChangePassword: boolean;
};

export default function SettingsPage() {
  const router = useRouter();

  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteEmail, setDeleteEmail] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);

  useEffect(() => {
    async function loadAccount() {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        router.replace("/login");
        return;
      }

      const providers =
        user.identities?.map((identity) => identity.provider) ?? [];

      const provider =
        user.app_metadata?.provider || providers[0] || "email";

      const canChangePassword =
        providers.includes("email") || provider === "email";

      setAccount({
        email: user.email || "No email available",
        provider,
        canChangePassword,
      });

      setLoading(false);
    }

    loadAccount();
  }, [router]);

  async function handlePasswordChange(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!account?.canChangePassword || changingPassword) {
      return;
    }

    if (newPassword.length < 8) {
      alert("Password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    try {
      setChangingPassword(true);

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        console.error("CHANGE PASSWORD ERROR:", error);
        alert(error.message);
        return;
      }

      setNewPassword("");
      setConfirmPassword("");

      alert("Password changed successfully.");
    } catch (error) {
      console.error("CHANGE PASSWORD ERROR:", error);
      alert("Something went wrong while changing your password.");
    } finally {
      setChangingPassword(false);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  async function handleDeleteAccount() {
    if (!account || deletingAccount) return;

    if (deleteEmail.trim().toLowerCase() !== account.email.toLowerCase()) {
      alert("Enter the email address shown on your account.");
      return;
    }

    if (deleteConfirmation !== "DELETE") {
      alert('Type "DELETE" exactly to confirm.');
      return;
    }

    const finalConfirmation = window.confirm(
      "This permanently deletes your profile, creator page, blocks, analytics, uploaded account assets, and login account. This cannot be undone. Continue?"
    );

    if (!finalConfirmation) return;

    try {
      setDeletingAccount(true);

      const response = await fetch("/api/account/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: deleteEmail.trim(),
          confirmation: deleteConfirmation,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        success?: boolean;
        error?: string;
      };

      if (!response.ok || !data.success) {
        console.error("ACCOUNT DELETE ERROR:", data);
        alert(data.error || "Could not delete your account.");
        return;
      }

      await supabase.auth.signOut();

      window.location.assign("/");
    } catch (error) {
      console.error("ACCOUNT DELETE ERROR:", error);
      alert("Something went wrong while deleting your account.");
    } finally {
      setDeletingAccount(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050505] text-white">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-violet-500" />

          <p className="mt-4 text-sm text-gray-500">
            Loading account settings...
          </p>
        </div>
      </main>
    );
  }

  if (!account) return null;

  const deletionReady =
    deleteEmail.trim().toLowerCase() === account.email.toLowerCase() &&
    deleteConfirmation === "DELETE";

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <div className="mx-auto max-w-5xl px-5 py-8 sm:px-6 lg:py-10">

        <section>
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/[0.07] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-violet-300">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
            Account
          </div>

          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Account settings
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-500 sm:text-base">
            Manage your sign-in details, password and account security.
          </p>
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.025] p-6 sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-400">
            Account
          </p>

          <h2 className="mt-2 text-xl font-semibold">
            Account information
          </h2>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-gray-600">
                Email address
              </p>

              <p className="mt-2 break-all text-sm font-medium text-gray-200">
                {account.email}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-gray-600">
                Login method
              </p>

              <p className="mt-2 text-sm font-medium text-gray-200">
                {account.provider === "google"
                  ? "Google"
                  : "Email & password"}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.025] p-6 sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-400">
            Security
          </p>

          <h2 className="mt-2 text-xl font-semibold">Password</h2>

          {account.canChangePassword ? (
            <>
              <p className="mt-2 text-sm leading-6 text-gray-500">
                Set a new password for your account.
              </p>

              <form
                onSubmit={handlePasswordChange}
                className="mt-6 space-y-5"
              >
                <div>
                  <label
                    htmlFor="new-password"
                    className="mb-2 block text-sm font-medium text-gray-300"
                  >
                    New password
                  </label>

                  <input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(event) =>
                      setNewPassword(event.target.value)
                    }
                    minLength={8}
                    required
                    autoComplete="new-password"
                    disabled={changingPassword}
                    placeholder="Enter a new password"
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none transition placeholder:text-gray-700 focus:border-violet-500 disabled:opacity-50"
                  />

                  <p className="mt-2 text-xs text-gray-600">
                    Minimum 8 characters
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="confirm-password"
                    className="mb-2 block text-sm font-medium text-gray-300"
                  >
                    Confirm new password
                  </label>

                  <input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) =>
                      setConfirmPassword(event.target.value)
                    }
                    minLength={8}
                    required
                    autoComplete="new-password"
                    disabled={changingPassword}
                    placeholder="Repeat your new password"
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none transition placeholder:text-gray-700 focus:border-violet-500 disabled:opacity-50"
                  />
                </div>

                <button
                  type="submit"
                  disabled={changingPassword}
                  className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {changingPassword
                    ? "Updating password..."
                    : "Change password"}
                </button>
              </form>
            </>
          ) : (
            <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-5">
              <p className="font-semibold text-gray-200">
                Signed in with Google
              </p>

              <p className="mt-1 text-sm leading-6 text-gray-500">
                Your account currently uses Google authentication.
              </p>
            </div>
          )}
        </section>

        <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.025] p-6 sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-600">
            Session
          </p>

          <h2 className="mt-2 text-xl font-semibold">Sign out</h2>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            End your current session and return to the login page.
          </p>

          <button
            type="button"
            onClick={handleSignOut}
            className="mt-5 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-semibold transition hover:bg-white/[0.07]"
          >
            Sign out
          </button>
        </section>

        <section className="mt-6 rounded-3xl border border-red-500/20 bg-red-500/[0.04] p-6 sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-red-400">
            Danger zone
          </p>

          <h2 className="mt-2 text-xl font-semibold">Delete account</h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
            Permanently delete your creator page, blocks, analytics, profile,
            uploaded account assets and login account. This cannot be undone.
          </p>

          {!deleteOpen ? (
            <button
              type="button"
              onClick={() => setDeleteOpen(true)}
              className="mt-5 rounded-xl border border-red-500/25 bg-red-500/[0.08] px-5 py-3 text-sm font-semibold text-red-300 transition hover:bg-red-500/[0.14]"
            >
              Delete my account
            </button>
          ) : (
            <div className="mt-6 rounded-2xl border border-red-500/20 bg-black/20 p-5">
              <p className="font-semibold text-red-200">
                Confirm permanent deletion
              </p>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Enter your account email and type{" "}
                <span className="font-mono font-semibold text-red-300">
                  DELETE
                </span>{" "}
                exactly.
              </p>

              <div className="mt-5 space-y-4">
                <div>
                  <label
                    htmlFor="delete-email"
                    className="mb-2 block text-sm font-medium text-gray-300"
                  >
                    Account email
                  </label>

                  <input
                    id="delete-email"
                    type="email"
                    value={deleteEmail}
                    onChange={(event) => setDeleteEmail(event.target.value)}
                    placeholder={account.email}
                    disabled={deletingAccount}
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none transition placeholder:text-gray-700 focus:border-red-500 disabled:opacity-50"
                  />
                </div>

                <div>
                  <label
                    htmlFor="delete-confirmation"
                    className="mb-2 block text-sm font-medium text-gray-300"
                  >
                    Type DELETE
                  </label>

                  <input
                    id="delete-confirmation"
                    type="text"
                    value={deleteConfirmation}
                    onChange={(event) =>
                      setDeleteConfirmation(event.target.value)
                    }
                    placeholder="DELETE"
                    autoComplete="off"
                    disabled={deletingAccount}
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 font-mono outline-none transition placeholder:text-gray-700 focus:border-red-500 disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={!deletionReady || deletingAccount}
                  className="rounded-xl bg-red-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {deletingAccount
                    ? "Deleting account..."
                    : "Permanently delete account"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDeleteOpen(false);
                    setDeleteEmail("");
                    setDeleteConfirmation("");
                  }}
                  disabled={deletingAccount}
                  className="rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-semibold text-gray-300 transition hover:bg-white/[0.07] disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}