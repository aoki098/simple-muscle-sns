export default function SettingsPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
        ⚙️ 設定・プロフィール
      </h1>
      
      {/* 設定メニューのボタン一覧（今は見た目だけ） */}
      <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
        
        <button className="w-full py-3 bg-purple-50 text-purple-700 font-bold rounded-md hover:bg-purple-100 border border-purple-200 transition">
          🎨 プロフィールの色を変更
        </button>
        
        <button className="w-full py-3 bg-blue-50 text-blue-700 font-bold rounded-md hover:bg-blue-100 border border-blue-200 transition">
          👤 アカウント情報
        </button>
        
        <button className="w-full py-3 bg-red-50 text-red-700 font-bold rounded-md hover:bg-red-100 border border-red-200 transition mt-8">
          🚪 ログアウト
        </button>
        
      </div>
    </main>
  );
}