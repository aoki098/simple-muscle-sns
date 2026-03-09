"use client";

import { useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/components/ThemeContext";
import { Dumbbell, Flame, Utensils, CheckCircle2, AlertCircle, Save, ImagePlus, X } from "lucide-react";

type Exercise = { name: string; weight: number | ""; details: string };

export default function PostPage() {
  const { theme } = useTheme();
  
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [exercises, setExercises] = useState<Exercise[]>([{ name: "", weight: "", details: "" }]);
  const [mealCalories, setMealCalories] = useState<number | "">("");
  const [mealProtein, setMealProtein] = useState<number | "">("");
  const [mealFat, setMealFat] = useState<number | "">("");
  const [mealCarbs, setMealCarbs] = useState<number | "">("");
  const [mealDetails, setMealDetails] = useState("");
  
  // 💡 複数画像に対応させるため、配列（配列）に変更！！
  const [postImages, setPostImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isPosting, setIsPosting] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const addExercise = () => {
    setExercises([...exercises, { name: "", weight: "", details: "" }]);
  };

  const updateExercise = (index: number, field: keyof Exercise, value: string | number) => {
    const newExercises = [...exercises];
    newExercises[index] = { ...newExercises[index], [field]: value };
    setExercises(newExercises);
  };

  // 💡 選択した画像を個別に削除する機能
  const removeImage = (indexToRemove: number) => {
    setPostImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
    setPreviewUrls(prev => {
      const newUrls = [...prev];
      URL.revokeObjectURL(newUrls[indexToRemove]); // メモリの解放
      newUrls.splice(indexToRemove, 1);
      return newUrls;
    });
  };

  const handlePost = async () => {
    setIsPosting(true);
    setMessage("");
    setIsError(false);

    const validExercises = exercises.filter(ex => ex.name.trim() !== "");
    const hasMeal = Number(mealCalories) > 0 || mealDetails.trim() !== "";
    const hasImage = postImages.length > 0; // 💡 複数対応

    if (validExercises.length === 0 && !hasMeal && !hasImage) {
      setMessage("入力内容がありません");
      setIsError(true);
      setIsPosting(false);
      return; 
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setMessage("ログインしていません");
      setIsError(true);
      setIsPosting(false);
      return;
    }

    try {
      let finalImageUrls: string[] = [];

      // 💡 複数枚の画像を同時にアップロードするエンジン（Promise.all）！！
      if (postImages.length > 0) {
        setMessage("画像をアップロード中...");
        
        const uploadPromises = postImages.map(async (file) => {
          const fileExt = file.name.split('.').pop();
          const filePath = `${user.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from('post_images')
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          const { data } = supabase.storage.from('post_images').getPublicUrl(filePath);
          return data.publicUrl; // URLを返す
        });

        finalImageUrls = await Promise.all(uploadPromises); // 全部終わるまで待つ！
      }

      setMessage("記録を保存中...");

      const { error } = await supabase.from("posts").insert([
        {
          user_id: user.id,
          date: date,
          exercises: validExercises,
          meal_calories: mealCalories || 0,
          meal_protein: mealProtein || 0,
          meal_fat: mealFat || 0,
          meal_carbs: mealCarbs || 0,
          meal_details: mealDetails,
          image_url: finalImageUrls.length > 0 ? finalImageUrls : null, // 💡 配列として保存！！
        }
      ]);

      if (error) {
        setMessage(`エラー: ${error.message}`);
        setIsError(true);
      } else {
        setMessage("記録を保存しました！");
        setIsError(false);
        setExercises([{ name: "", weight: "", details: "" }]);
        setMealCalories(""); setMealProtein(""); setMealFat(""); setMealCarbs(""); setMealDetails("");
        
        setPostImages([]);
        setPreviewUrls([]);
        if (fileInputRef.current) fileInputRef.current.value = '';
        
        setTimeout(() => setMessage(""), 3000); 
      }
    } catch (err: any) {
      setMessage(`エラー: ${err.message}`);
      setIsError(true);
    }
    
    setIsPosting(false);
  };

  const containerClass = theme === "light" ? "bg-white text-gray-900" : "bg-black text-gray-100 border border-gray-800";
  const inputClass = theme === "light" ? "bg-gray-50 border-gray-300 focus:border-blue-500 text-gray-900" : "bg-gray-900 border-gray-700 focus:border-blue-500 text-white";
  const buttonClass = theme === "dark-red" ? "bg-red-700 hover:bg-red-800" : "bg-blue-600 hover:bg-blue-700";

  return (
    <main className="min-h-screen py-0 px-0 transition-colors duration-300 pb-24">
      <div className={`max-w-xl mx-auto px-6 pt-4 pb-6 rounded-lg shadow-md relative ${containerClass}`}>
        
        <button 
          onClick={() => fileInputRef.current?.click()}
          className={`absolute top-3 right-5 p-1 transition-colors ${postImages.length >= 4 ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 hover:text-gray-200'}`}
          title="写真を追加 (最大4枚)"
          disabled={postImages.length >= 4} // 💡 4枚でボタンを無効化
        >
          <ImagePlus className="w-7 h-7" />
        </button>

        {/* 💡 multiple属性を追加して複数選択可能に！ */}
        <input 
          type="file" 
          accept="image/*" 
          multiple
          hidden
          ref={fileInputRef}
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              const newFiles = Array.from(e.target.files);
              // 💡 最大4枚までに制限して合体！
              const combinedFiles = [...postImages, ...newFiles].slice(0, 4);
              setPostImages(combinedFiles);
              
              const newUrls = combinedFiles.map(file => URL.createObjectURL(file));
              setPreviewUrls(newUrls);
            }
          }}
        />

        <h1 className="text-[21px] font-bold mb-0 flex items-center justify-center gap-2">
          <Dumbbell className="w-6 h-6 text-gray-500" />
          筋トレ＆食事記録
        </h1>
        
        <div className="space-y-4">
          <div className="mt-0">
            <label className="block text-sm font-bold mb-2">日付</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={`w-full rounded-md border p-2 ${inputClass}`} />
          </div>

          <div className="border-t border-gray-700 pt-5">
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" />
              トレーニング内容
            </h2>
            {exercises.map((ex, i) => (
              <div key={i} className="flex space-x-2 mb-3">
                <input type="text" placeholder="種目名 (例: ベンチ)" value={ex.name} onChange={(e) => updateExercise(i, 'name', e.target.value)} className={`w-2/5 rounded-md border p-2 ${inputClass}`} />
                <input type="number" placeholder="重量(kg)" value={ex.weight} onChange={(e) => updateExercise(i, 'weight', Number(e.target.value))} className={`w-1/5 rounded-md border p-2 ${inputClass}`} />
                <input type="text" placeholder="回数・メモ" value={ex.details} onChange={(e) => updateExercise(i, 'details', e.target.value)} className={`w-2/5 rounded-md border p-2 ${inputClass}`} />
              </div>
            ))}
            <button onClick={addExercise} className="text-sm text-blue-500 font-bold mt-2 hover:underline">+ 種目を追加</button>
          </div>

          <div className="border-t border-gray-700 pt-5">
            <h2 className="text-lg font-bold mb-0 flex items-center gap-2">
              <Utensils className="w-5 h-5 text-yellow-500" />
              食事・PFC
            </h2>
            <div className="grid grid-cols-4 gap-2 mb-2">
              <div><label className="text-xs">kcal</label><input type="number" value={mealCalories} onChange={(e) => setMealCalories(Number(e.target.value))} className={`w-full rounded-md border p-2 ${inputClass}`} /></div>
              <div><label className="text-xs">P (タンパク質)</label><input type="number" value={mealProtein} onChange={(e) => setMealProtein(Number(e.target.value))} className={`w-full rounded-md border p-2 ${inputClass}`} /></div>
              <div><label className="text-xs">F (脂質)</label><input type="number" value={mealFat} onChange={(e) => setMealFat(Number(e.target.value))} className={`w-full rounded-md border p-2 ${inputClass}`} /></div>
              <div><label className="text-xs">C (炭水化物)</label><input type="number" value={mealCarbs} onChange={(e) => setMealCarbs(Number(e.target.value))} className={`w-full rounded-md border p-2 ${inputClass}`} /></div>
            </div>
            <textarea placeholder="食事のメモ" value={mealDetails} onChange={(e) => setMealDetails(e.target.value)} rows={2} className={`w-full rounded-md border p-3 ${inputClass}`} />
          </div>

          {/* 💡 ここが美しい2x2グリッドのプレビューです！ */}
          {previewUrls.length > 0 && (
            <div className={`grid gap-2 mt-4 ${previewUrls.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {previewUrls.map((url, idx) => (
                <div key={idx} className="relative aspect-square">
                  <img src={url} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover rounded-md border border-gray-700 bg-black/20" />
                  <button 
                    onClick={() => removeImage(idx)}
                    className="absolute top-2 right-2 bg-black/70 text-white rounded-full p-1.5 text-xs hover:bg-black transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <button onClick={handlePost} disabled={isPosting} className={`w-full py-3 rounded-md text-white font-bold transition shadow-md flex items-center justify-center gap-2 mt-4 ${buttonClass} ${isPosting ? "opacity-50" : ""}`}>
            <Save className="w-5 h-5" />
            {isPosting ? "保存中..." : "記録を保存する"}
          </button>

          {message && (
            <p className={`flex items-center justify-center gap-1 font-bold text-sm mt-2 ${isError ? "text-red-500" : "text-green-500"}`}>
              {isError ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
              {message}
            </p>
          )}

        </div>
      </div>
    </main>
  );
}