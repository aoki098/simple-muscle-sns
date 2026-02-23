"use client";

import { useState } from "react";
import { Post, Exercise } from "@/types/Post";

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
    if (formData.exercises.length >= 100) {
      alert("追加できる種目は100個までです！");
      return;
    }
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

    // 送信する直前に、空欄("")になっている項目をすべて「0」に自動変換する
    const sanitizedData = {
      ...formData,
      exercises: formData.exercises.map((ex) => ({
        ...ex,
        weight: ex.weight === "" ? 0 : ex.weight, // 重量がない場合は0kgにする
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
        // 0に変換済みの sanitizedData を送る
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
    <form onSubmit={handleSubmit} className="p-4 border rounded-lg shadow-md bg-white max-w-xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">🏋️‍♀️ 今日のトレーニングと食事を投稿</h2>

      {/* --- 💪 トレーニング入力セクション --- */}
      <h3 className="text-xl font-semibold mt-6 mb-2 text-blue-600">💪 トレーニング</h3>
      
      <div className="space-y-6">
        {formData.exercises.map((exercise, index) => (
          <div key={index} className="p-4 border border-blue-200 rounded-md bg-blue-50 relative">
            
            {formData.exercises.length > 1 && (
              <button
                type="button"
                onClick={() => removeExercise(index)}
                className="absolute top-2 right-2 text-red-500 font-bold p-1 hover:bg-red-100 rounded"
              >
                ✕ 削除
              </button>
            )}
            
            <h4 className="font-bold mb-3 text-blue-800">メニュー {index + 1}</h4>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">やった種目</label>
                <input
                  type="text"
                  value={exercise.name}
                  onChange={(e) => handleExerciseChange(index, "name", e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 border p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">最大重量 (kg)</label>
                <input
                  type="number"
                  value={exercise.weight}
                  onChange={(e) => handleExerciseChange(index, "weight", e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 border p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">メモ</label>
                <textarea
                  value={exercise.details}
                  onChange={(e) => handleExerciseChange(index, "details", e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 border p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
        className="mt-4 w-full py-2 px-4 rounded-md border-2 border-dashed border-blue-400 text-blue-600 font-bold hover:bg-blue-50 transition duration-150"
      >
        ＋ メニューを追加する
      </button>

      {/* --- 🥗 食事入力セクション --- */}
      <h3 className="text-xl font-semibold mt-8 mb-2 text-green-600">🥗 食事 (PFC)</h3>
      <div className="space-y-4">
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">カロリー (kcal)</label>
            <input
              type="number"
              name="mealCalories"
              value={formData.mealCalories}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 border p-2 shadow-sm focus:border-green-500 focus:ring-green-500"
              min="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">タンパク質 (g)</label>
            <input
              type="number"
              name="mealProteinGrams"
              value={formData.mealProteinGrams}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 border p-2 shadow-sm focus:border-green-500 focus:ring-green-500"
              min="0"
            />
          </div>
          <div>
            {/* 👇 ラベルとnameを正しく「脂質」に修正しました */}
            <label className="block text-sm font-medium text-gray-700">脂質 (g)</label>
            <input
              type="number"
              name="mealFatGrams"
              value={formData.mealFatGrams}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 border p-2 shadow-sm focus:border-green-500 focus:ring-green-500"
              min="0"
            />
          </div>
          <div>
            {/* 👇 ラベルとnameを正しく「炭水化物」に修正しました */}
            <label className="block text-sm font-medium text-gray-700">炭水化物 (g)</label>
            <input
              type="number"
              name="mealCarbsGrams"
              value={formData.mealCarbsGrams}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 border p-2 shadow-sm focus:border-green-500 focus:ring-green-500"
              min="0"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">メモ</label>
          <textarea
            name="mealDetails"
            value={formData.mealDetails}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 border p-2 shadow-sm focus:border-green-500 focus:ring-green-500"
            rows={3}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className={`mt-8 w-full py-3 px-4 rounded-md text-white font-bold transition duration-150 ${
          isSubmitting ? "bg-gray-400 cursor-not-allowed" : "bg-red-500 hover:bg-red-600 shadow-md"
        }`}
      >
        {isSubmitting ? "投稿中..." : "ポストする！"}
      </button>

      {message && (
        <p className="mt-4 text-center text-green-700 font-medium bg-green-50 p-2 rounded">
          {message}
        </p>
      )}
    </form>
  );
}