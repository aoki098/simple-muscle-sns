"use client";

import { useState } from "react";
import { Post, Exercise } from "@/types/Post";
import { useTheme } from "@/components/ThemeContext";

type PostFormProps = {
  onPostSuccess: () => void;
};

const initialPost: Omit<Post, "id" | "userName" | "likes"> = {
  date: new Date().toISOString().substring(0, 10),
  exercises: [{ name: "", weight: "", details: "" }], 
  mealCalories: "",
  mealProteinGrams: "", 
  mealFatGrams: "",
  mealCarbsGrams: "",
  mealDetails: "",
};

export default function PostForm({ onPostSuccess }: PostFormProps) {
  const [formData, setFormData] = useState(initialPost);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const { theme } = useTheme();

  // フォーム全体も真っ黒に！
  const containerClass = theme === "light"
    ? "bg-white border-gray-200 shadow-md"
    : theme === "dark-red"
      ? "bg-black border-red-900 text-red-50 shadow-red-900/20"
      : "bg-black border-blue-900 text-blue-50 shadow-blue-900/20";

  const inputClass = theme === "light"
    ? "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
    : theme === "dark-red"
      ? "bg-black border-red-900 text-white focus:border-red-500 focus:ring-red-500 placeholder-red-900"
      : "bg-black border-blue-900 text-white focus:border-blue-500 focus:ring-blue-500 placeholder-blue-900";

  const labelClass = theme === "light" ? "text-gray-700" : "text-gray-300";
  const headingColor = theme === "dark-red" ? "text-red-500" : theme === "dark-blue" ? "text-blue-400" : "text-blue-600";
  
  const menuCardClass = theme === "light"
    ? "border-blue-200 bg-blue-50"
    : theme === "dark-red"
      ? "border-red-900 bg-black"
      : "border-blue-900 bg-black";

  const addButtonClass = theme === "dark-red" 
    ? "border-red-700 text-red-500 hover:bg-red-950" 
    : theme === "dark-blue" 
      ? "border-blue-700 text-blue-500 hover:bg-blue-950" 
      : "border-blue-400 text-blue-600 hover:bg-blue-50";

  const submitButtonClass = theme === "dark-red"
    ? "bg-red-700 hover:bg-red-800 shadow-red-500/30"
    : theme === "dark-blue"
      ? "bg-blue-700 hover:bg-blue-800 shadow-blue-500/30"
      : "bg-red-500 hover:bg-red-600 shadow-md";

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? (value === "" ? "" : Number(value)) : value,
    }));
  };

  const handleExerciseChange = (index: number, field: keyof Exercise, value: string) => {
    setFormData((prev) => {
      const newExercises = [...prev.exercises];
      newExercises[index] = {
        ...newExercises[index],
        [field]: field === "weight" ? (value === "" ? "" : Number(value)) : value,
      };
      return { ...prev, exercises: newExercises };
    });
  };

  const addExercise = () => {
    if (formData.exercises.length >= 100) return;
    setFormData((prev) => ({
      ...prev,
      exercises: [...prev.exercises, { name: "", weight: "", details: "" }],
    }));
  };

  const removeExercise = (index: number) => {
    if (formData.exercises.length <= 1) return;
    setFormData((prev) => {
      const newExercises = [...prev.exercises];
      newExercises.splice(index, 1);
      return { ...prev, exercises: newExercises };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    const sanitizedData = {
      ...formData,
      exercises: formData.exercises.map((ex) => ({
        ...ex,
        weight: ex.weight === "" ? 0 : ex.weight,
      })),
      mealCalories: formData.mealCalories === "" ? 0 : formData.mealCalories,
      mealProteinGrams: formData.mealProteinGrams === "" ? 0 : formData.mealProteinGrams,
      mealFatGrams: formData.mealFatGrams === "" ? 0 : formData.mealFatGrams,
      mealCarbsGrams: formData.mealCarbsGrams === "" ? 0 : formData.mealCarbsGrams,
    };

    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sanitizedData),
      });

      if (!response.ok) throw new Error("サーバーエラー: 投稿に失敗しました");

      setMessage("💪 投稿が完了しました！");
      setFormData(initialPost);
      onPostSuccess();
    } catch (error) {
      setMessage(`❌ エラー: ${(error as Error).message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`p-4 border rounded-lg max-w-xl mx-auto transition-colors duration-300 ${containerClass}`}>
      <h2 className="text-2xl font-bold mb-4">🏋️‍♀️ 今日のトレーニングと食事を投稿</h2>

      <h3 className={`text-xl font-semibold mt-6 mb-2 transition-colors duration-300 ${headingColor}`}>💪 トレーニング</h3>
      
      <div className="space-y-6">
        {formData.exercises.map((exercise, index) => (
          <div key={index} className={`p-4 border rounded-md relative transition-colors duration-300 ${menuCardClass}`}>
            
            {formData.exercises.length > 1 && (
              <button
                type="button"
                onClick={() => removeExercise(index)}
                className={`absolute top-2 right-2 font-bold p-1 rounded transition-colors ${
                  theme === "light" ? "text-red-500 hover:bg-red-100" : "text-red-400 hover:bg-red-900/50"
                }`}
              >
                ✕ 削除
              </button>
            )}
            
            <h4 className={`font-bold mb-3 ${headingColor}`}>メニュー {index + 1}</h4>
            
            <div className="space-y-3">
              <div>
                <label className={`block text-sm font-medium ${labelClass}`}>やった種目</label>
                <input
                  type="text"
                  value={exercise.name}
                  onChange={(e) => handleExerciseChange(index, "name", e.target.value)}
                  className={`mt-1 block w-full rounded-md border p-2 shadow-sm transition-colors duration-300 ${inputClass}`}
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium ${labelClass}`}>最大重量 (kg)</label>
                <input
                  type="number"
                  value={exercise.weight}
                  onChange={(e) => handleExerciseChange(index, "weight", e.target.value)}
                  className={`mt-1 block w-full rounded-md border p-2 shadow-sm transition-colors duration-300 ${inputClass}`}
                  min="0"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${labelClass}`}>メモ</label>
                <textarea
                  value={exercise.details}
                  onChange={(e) => handleExerciseChange(index, "details", e.target.value)}
                  className={`mt-1 block w-full rounded-md border p-2 shadow-sm transition-colors duration-300 ${inputClass}`}
                  rows={2}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addExercise}
        className={`mt-4 w-full py-2 px-4 rounded-md border-2 border-dashed font-bold transition duration-150 ${addButtonClass}`}
      >
        ＋ メニューを追加する
      </button>

      <h3 className={`text-xl font-semibold mt-8 mb-2 transition-colors duration-300 ${headingColor}`}>🥗 食事 (PFC)</h3>
      <div className="space-y-4">
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={`block text-sm font-medium ${labelClass}`}>カロリー (kcal)</label>
            <input
              type="number"
              name="mealCalories"
              value={formData.mealCalories}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-md border p-2 shadow-sm transition-colors duration-300 ${inputClass}`}
              min="0"
            />
          </div>
          <div>
            <label className={`block text-sm font-medium ${labelClass}`}>タンパク質 (g)</label>
            <input
              type="number"
              name="mealProteinGrams"
              value={formData.mealProteinGrams}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-md border p-2 shadow-sm transition-colors duration-300 ${inputClass}`}
              min="0"
            />
          </div>
          <div>
            <label className={`block text-sm font-medium ${labelClass}`}>脂質 (g)</label>
            <input
              type="number"
              name="mealFatGrams"
              value={formData.mealFatGrams}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-md border p-2 shadow-sm transition-colors duration-300 ${inputClass}`}
              min="0"
            />
          </div>
          <div>
            <label className={`block text-sm font-medium ${labelClass}`}>炭水化物 (g)</label>
            <input
              type="number"
              name="mealCarbsGrams"
              value={formData.mealCarbsGrams}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-md border p-2 shadow-sm transition-colors duration-300 ${inputClass}`}
              min="0"
            />
          </div>
        </div>

        <div>
          <label className={`block text-sm font-medium ${labelClass}`}>メモ</label>
          <textarea
            name="mealDetails"
            value={formData.mealDetails}
            onChange={handleChange}
            className={`mt-1 block w-full rounded-md border p-2 shadow-sm transition-colors duration-300 ${inputClass}`}
            rows={3}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className={`mt-8 w-full py-3 px-4 rounded-md text-white font-bold transition duration-150 ${
          isSubmitting ? "bg-gray-400 cursor-not-allowed" : submitButtonClass
        }`}
      >
        {isSubmitting ? "投稿中..." : "ポストする！"}
      </button>

      {message && (
        <p className="mt-4 text-center font-medium p-2 rounded bg-green-100 text-green-800">
          {message}
        </p>
      )}
    </form>
  );
}