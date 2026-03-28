"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function TranslationsPage() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const { data } = await supabase.from("translations").select("*");
    setData(data || []);
  }

  async function updateValue(id: string, value: string) {
    await supabase
      .from("translations")
      .update({ value })
      .eq("id", id);

    fetchData();
  }

  return (
    <div className="p-6">
      <h1>Übersetzungen</h1>

      {data.map((item) => (
        <div key={item.id} className="flex gap-4 mb-2">
          <span>{item.category}</span>
          <span>{item.key}</span>

          <input
            defaultValue={item.value}
            onBlur={(e) => updateValue(item.id, e.target.value)}
            className="border px-2"
          />
        </div>
      ))}
    </div>
  );
}