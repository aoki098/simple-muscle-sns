// app/post/edit/[id]/page.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/components/ThemeContext";
import { Dumbbell, Flame, Utensils, CheckCircle2, AlertCircle, Save, ImagePlus, X, Loader2, ArrowLeft } from "lucide-react";
import { useRouter, useParams } from "next/navigation";

type Exercise = { name: string; weight: number | ""; details: string };

export default function EditPostPage() {
  const { theme } = useTheme();
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;
  
  const [isAuthChecking, setIsAuthChecking] = useState(true); 

  const [date, setDate] = useState("");
  const [exercises, setExercises] = useState<Exercise[]>([{ name: "", weight: "", details: "" }]);
  const [mealCalories, setMealCalories] = useState<number | "">("");
  const [mealProtein, setMealProtein] = useState<number | "">("");
  const [mealFat, setMealFat] = useState<number | "">("");
  const [mealCarbs, setMealCarbs] = useState<number | "">("");
  const [mealDetails, setMealDetails] = useState("");
  
  const [postImages, setPostImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isPosting, setIsPosting] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const fetchPostData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      
      const { data, error } = await supabase.from("posts").select("*").eq("id", postId).eq("user_id", user.id).single();
      
      if (data) {
        setDate(data.date || new Date().toISOString().split('T')[0]);
        setExercises(data.exercises?.length ? data.exercises : [{ name: "", weight: "", details: "" }]);
        setMealCalories(data.meal_calories || "");
        setMealProtein(data.meal_protein || "");
        setMealFat(data.meal_fat || "");
        setMealCarbs(data.meal_carbs || "");
        setMealDetails(data.meal_details || "");
        
        const imageUrls = data.image_url ? (Array.isArray(data.image_url) ? data.image_url : [data.image_url]) : [];
        setExistingImageUrls(imageUrls);
        setPreviewUrls(imageUrls);
      } else {
        router.push("/");
      }
      
      setIsAuthChecking(false);
    };
    fetchPostData();
  }, [router, postId]);

  const addExercise = () => {
    setExercises([...exercises, { name: "", weight: "", details: "" }]);
  };

  const updateExercise = (index: number, field: keyof Exercise, value: string | number) => {
    const newExercises = [...exercises];
    newExercises[index] = { ...newExercises[index], [field]: value };
    setExercises(newExercises);
  };

  const removeImage = (indexToRemove: number) => {
    if (indexToRemove < existingImageUrls.length) {
      setExistingImageUrls(prev => prev.filter((_, idx) => idx !== indexToRemove));
    } else {
      const newFileIndex = indexToRemove - existingImageUrls.length;
      setPostImages(prev => prev.filter((_, idx) => idx !== newFileIndex));
    }
    
    setPreviewUrls(prev => {
      const newUrls = [...prev];
      if (indexToRemove >= existingImageUrls.length) {
        URL.revokeObjectURL(newUrls[indexToRemove]);
      }
      newUrls.splice(indexToRemove, 1);
      return newUrls;
    });
  };

  const handleUpdate = async () => {
    setIsPosting(true);
    setMessage("");
    setIsError(false);

    const validExercises = exercises.filter(ex => ex.name.trim() !== "");
    const hasMeal = Number(mealCalories) > 0 || mealDetails.trim() !== "";
    const hasImage = existingImageUrls.length > 0 || postImages.length > 0;

    if (validExercises.length === 0 && !hasMeal && !hasImage) {
      setMessage("入力内容がありません");
      setIsError(true);
      setIsPosting(false);
      return; 
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      let finalImageUrls = [...existingImageUrls];

      if (postImages.length > 0) {
        setMessage("新しい画像をアップロード中...");
        
        const uploadPromises = postImages.map(async (file) => {
          const fileExt = file.name.split('.').pop();
          const filePath = `${user.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from('post_images')
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          const { data } = supabase.storage.from('post_images').getPublicUrl(filePath);
          return data.publicUrl; 
        });

        const newUploadedUrls = await Promise.all(uploadPromises); 
        finalImageUrls = [...finalImageUrls, ...newUploadedUrls];
      }

      setMessage("記録を更新中...");

      const { error } = await supabase.from("posts").update({
        date: date,
        exercises: validExercises,
        meal_calories: mealCalories || 0,
        meal_protein: mealProtein || 0,
        meal_fat: mealFat || 0,
        meal_carbs: mealCarbs || 0,
        meal_details: mealDetails,
        image_url: finalImageUrls.length > 0 ? finalImageUrls : null, 
      }).eq("id", postId).eq("user_id", user.id);

      if (error) {
        setMessage(`エラー: ${error.message}`);
        setIsError(true);
      } else {
        setMessage("記録を更新しました！");
        setIsError(false);
        setTimeout(() => router.back(), 1500); 
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

  if (isAuthChecking) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === 'light' ? 'bg-gray-50' : 'bg-black'}`}>
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <main className="min-h-screen py-0 px-0 transition-colors duration-300 pb-24">
      <div className={`max-w-xl mx-auto px-6 pt-4 pb-6 rounded-lg shadow-md relative ${containerClass}`}>
        
        <div className="flex items-center mb-6">
          <button onClick={() => router.back()} className="mr-4 p-2 hover:bg-gray-700/50 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-[21px] font-bold mb-0 flex items-center justify-center gap-2">
            <Dumbbell className="w-6 h-6 text-gray-500" />
            記録を編集
          </h1>
        </div>

        <button 
          onClick={() => fileInputRef.current?.click()}
          className={`absolute top-3 right-5 p-1 transition-colors ${previewUrls.length >= 4 ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 hover:text-gray-200'}`}
          title="写真を追加 (最大4枚)"
          disabled={previewUrls.length >= 4}
        >
          <ImagePlus className="w-7 h-7" />
        </button>

        <input 
          type="file" 
          accept="image/*" 
          multiple
          hidden
          ref={fileInputRef}
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              const newFiles = Array.from(e.target.files);
              const availableSlots = 4 - previewUrls.length;
              const filesToAdd = newFiles.slice(0, availableSlots);
              
              setPostImages(prev => [...prev, ...filesToAdd]);
              
              const newUrls = filesToAdd.map(file => URL.createObjectURL(file));
              setPreviewUrls(prev => [...prev, ...newUrls]);
            }
          }}
        />
        
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
              <div><label className="text-[10px] font-bold opacity-80">カロリー</label><input type="number" value={mealCalories} onChange={(e) => setMealCalories(Number(e.target.value))} className={`w-full rounded-md border p-2 ${inputClass}`} /></div>
              <div><label className="text-[10px] font-bold opacity-80 text-blue-500 dark:text-blue-400">P(タンパク質)</label><input type="number" value={mealProtein} onChange={(e) => setMealProtein(Number(e.target.value))} className={`w-full rounded-md border p-2 ${inputClass}`} /></div>
              <div><label className="text-[10px] font-bold opacity-80 text-orange-500 dark:text-orange-400">F(脂質)</label><input type="number" value={mealFat} onChange={(e) => setMealFat(Number(e.target.value))} className={`w-full rounded-md border p-2 ${inputClass}`} /></div>
              <div><label className="text-[10px] font-bold opacity-80 text-green-600 dark:text-green-400">C(炭水化物)</label><input type="number" value={mealCarbs} onChange={(e) => setMealCarbs(Number(e.target.value))} className={`w-full rounded-md border p-2 ${inputClass}`} /></div>
            </div>
            <textarea placeholder="食事のメモ" value={mealDetails} onChange={(e) => setMealDetails(e.target.value)} rows={2} className={`w-full rounded-md border p-3 ${inputClass}`} />
          </div>

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

          <button onClick={handleUpdate} disabled={isPosting} className={`w-full py-3 rounded-md text-white font-bold transition shadow-md flex items-center justify-center gap-2 mt-4 ${buttonClass} ${isPosting ? "opacity-50" : ""}`}>
            <Save className="w-5 h-5" />
            {isPosting ? "更新中..." : "記録を更新する"}
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