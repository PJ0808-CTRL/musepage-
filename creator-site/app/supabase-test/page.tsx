import { supabase } from "@/lib/supabase";

export default async function SupabaseTest() {
  const { data, error } = await supabase.auth.getSession();

  return (
    <main className="flex min-h-screen items-center justify-center bg-black text-white">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
        <h1 className="text-2xl font-bold">
          Supabase Connection Test
        </h1>

        {error ? (
          <p className="mt-4 text-red-400">
            ❌ Connection failed: {error.message}
          </p>
        ) : (
          <p className="mt-4 text-green-400">
            ✅ Supabase is connected!
          </p>
        )}

        <p className="mt-4 text-gray-400">
          Current session: {data.session ? "Logged in" : "Not logged in"}
        </p>
      </div>
    </main>
  );
}