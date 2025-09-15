"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { getUserNotes, saveUserNotes } from "@/services/contentService";
import { AppShell } from "@/components/app-shell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function NotesPage() {
  const { user } = useAuth();
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user) {
      setLoading(true);
      getUserNotes(user.id).then((data: { notes: string } | null) => {
        setNotes(data?.notes || "");
        setLoading(false);
      });
    }
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    await saveUserNotes(user.id, notes);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  if (loading) return <AppShell><div className="p-8">Loading...</div></AppShell>;

  return (
    <AppShell>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 max-w-3xl mx-auto gap-2">
        <div className="flex items-center w-full">
          <h1 className="text-3xl font-bold tracking-tight flex-1">Notes</h1>
          <Button
            className="sm:ml-4 ml-auto"
            onClick={handleSave}
            disabled={saving}
            variant="default"
          >
            {saving ? "Saving..." : saved ? "Saved!" : "Save"}
            {saved && (
              <span className="ml-2 text-green-400">✓</span>
            )}
          </Button>
        </div>
      </div>
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
        </CardHeader>
        <CardContent>
          <textarea
            className="w-full h-[60vh] sm:h-96 p-4 border rounded resize-none text-lg bg-card text-foreground"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Write your notes here..."
          />
        </CardContent>
      </Card>
    </AppShell>
  );
}
