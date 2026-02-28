"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/components/ThemeContext";

type Exercise = { name: string; weight: number | ""; details: string };

export default function PostPage() {
  const { theme } = useTheme();
  
  // 状態管理
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [exercises, setExercises] = useState<Exercise[]>([{ name: "", weight: "", details: "" }]);
  const [mealCalories, setMealCalories] = useState<number | "">("");
  const [mealProtein, setMealProtein] = useState<number | "">("");
  const [mealFat, setMealFat] = useState<number | "">("");
  const [mealCarbs, setMealCarbs] = useState<number | "">("");
  const [mealDetails, setMealDetails] = useState("");
  
  const [isPosting, setIsPosting] = useState(false);
  const [message, setMessage] = useState("");

  // 種目の入力欄を増やす
  const addExercise = () => {
    setExercises([...exercises, { name: "", weight: "", details: "" }]);
  };

  // 種目の入力内容を更新する
  const updateExercise = (index: number, field: keyof Exercise, value: string | number) => {
    const newExercises = [...exercises];
    newExercises[index] = { ...newExercises[index], [field]: value };
    setExercises(newExercises);
  };

  // 🚀 データベースに送信
  const handlePost = async () => {
    setIsPosting(true);
    setMessage("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setMessage("❌ ログインしていません");
      setIsPosting(false);
      return;
    }

    const { error } = await supabase.from("posts").insert([
      {
        user_id: user.id,
        date: date,
        exercises: exercises.filter(ex => ex.name !== ""), // 名前が空の種目は除外
        meal_calories: mealCalories || 0,
        meal_protein: mealProtein || 0,
        meal_fat: mealFat || 0,
        meal_carbs: mealCarbs || 0,
        meal_details: mealDetails,
      }
    ]);

    if (error) {
      setMessage(`❌ エラー: ${error.message}`);
    } else {
      setMessage("✅ 記録を保存しました！");
      // 入力欄をリセット（ページ移動はしません！）
      setExercises([{ name: "", weight: "", details: "" }]);
      setMealCalories(""); setMealProtein(""); setMealFat(""); setMealCarbs(""); setMealDetails("");
      setTimeout(() => setMessage(""), 3000); // 3秒後にメッセージだけ消す
    }
    setIsPosting(false);
  };

  // テーマ設定
  const containerClass = theme === "light" ? "bg-white text-gray-900" : "bg-black text-gray-100 border border-gray-800";
  const inputClass = theme === "light" ? "bg-gray-50 border-gray-300 focus:border-blue-500 text-gray-900" : "bg-gray-900 border-gray-700 focus:border-blue-500 text-white";
  const buttonClass = theme === "dark-red" ? "bg-red-700 hover:bg-red-800" : "bg-blue-600 hover:bg-blue-700";

  return (
    <main className="min-h-screen py-8 px-4 transition-colors duration-300 pb-24">
      <div className={`max-w-xl mx-auto p-6 rounded-lg shadow-md ${containerClass}`}>
        <h1 className="text-2xl font-bold mb-6 text-center">🏋️ 筋トレ＆食事記録</h1>
        
        <div className="space-y-6">
          {/* 日付 */}
          <div>
            <label className="block text-sm font-bold mb-2">日付</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={`w-full rounded-md border p-3 ${inputClass}`} />
          </div>

          {/* 筋トレメニュー */}
          <div className="border-t border-gray-700 pt-4">
            <h2 className="text-lg font-bold mb-3">🔥 トレーニング内容</h2>
            {exercises.map((ex, i) => (
              <div key={i} className="flex space-x-2 mb-3">
                <input type="text" placeholder="種目名 (例: ベンチ)" value={ex.name} onChange={(e) => updateExercise(i, 'name', e.target.value)} className={`w-2/5 rounded-md border p-2 ${inputClass}`} />
                <input type="number" placeholder="重量(kg)" value={ex.weight} onChange={(e) => updateExercise(i, 'weight', Number(e.target.value))} className={`w-1/5 rounded-md border p-2 ${inputClass}`} />
                <input type="text" placeholder="回数・メモ" value={ex.details} onChange={(e) => updateExercise(i, 'details', e.target.value)} className={`w-2/5 rounded-md border p-2 ${inputClass}`} />
              </div>
            ))}
            <button onClick={addExercise} className="text-sm text-blue-500 font-bold mt-2 hover:underline">+ 種目を追加</button>
          </div>

          {/* 食事・マクロ */}
          <div className="border-t border-gray-700 pt-4">
            <h2 className="text-lg font-bold mb-3">🍗 食事・PFC</h2>
            <div className="grid grid-cols-4 gap-2 mb-3">
              <div><label className="text-xs">kcal</label><input type="number" value={mealCalories} onChange={(e) => setMealCalories(Number(e.target.value))} className={`w-full rounded-md border p-2 ${inputClass}`} /></div>
              <div><label className="text-xs">P (タンパク質)</label><input type="number" value={mealProtein} onChange={(e) => setMealProtein(Number(e.target.value))} className={`w-full rounded-md border p-2 ${inputClass}`} /></div>
              <div><label className="text-xs">F (脂質)</label><input type="number" value={mealFat} onChange={(e) => setMealFat(Number(e.target.value))} className={`w-full rounded-md border p-2 ${inputClass}`} /></div>
              <div><label className="text-xs">C (炭水化物)</label><input type="number" value={mealCarbs} onChange={(e) => setMealCarbs(Number(e.target.value))} className={`w-full rounded-md border p-2 ${inputClass}`} /></div>
            </div>
            <textarea placeholder="食事のメモ" value={mealDetails} onChange={(e) => setMealDetails(e.target.value)} rows={2} className={`w-full rounded-md border p-3 ${inputClass}`} />
          </div>

          <button onClick={handlePost} disabled={isPosting} className={`w-full py-3 rounded-md text-white font-bold transition shadow-md ${buttonClass} ${isPosting ? "opacity-50" : ""}`}>
            {isPosting ? "保存中..." : "記録を保存する 🦍"}
          </button>

          {message && <p className={`text-center font-bold text-sm ${message.includes("❌") ? "text-red-500" : "text-green-500"}`}>{message}</p>}
        </div>
      </div>
    </main>
  );
}