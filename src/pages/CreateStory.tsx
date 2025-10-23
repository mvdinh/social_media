import { ArrowLeft, Edit3, Image as ImageIcon, Star } from "lucide-react";

const CreateStoryModal = ({ onClose }) => {
  const colorPalette = [
    "bg-blue-600",
    "bg-purple-600",
    "bg-red-500",
    "bg-pink-500",
    "bg-green-500",
    "bg-teal-500",
  ];

  const baseButtonClass =
    "flex items-center justify-center py-2 px-4 rounded-lg font-semibold text-sm transition duration-150";

  return (
    <div className="fixed inset-0 z-50 bg-black/50  flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl relative">
        <div className="flex items-center p-4 border-b border-gray-100">
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-900 transition mr-4"
            aria-label="Back"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h2 className="text-xl font-semibold text-gray-800">Create Story</h2>
        </div>

        <div className="p-6">
          {/* Story Preview/Input Area (Màu Tím đậm) */}
          <div className="relative h-96 w-full rounded-xl bg-purple-700 shadow-xl flex items-center justify-center p-6 mb-6">
            <textarea
              className="w-full h-full bg-transparent text-white text-2xl placeholder-white/80 resize-none border-none focus:outline-none text-center pt-16"
              placeholder="What's on your mind?"
              maxLength={200} // Giới hạn ký tự
            />
          </div>

          <div className="flex items-center justify-center space-x-3 mb-6">
            {colorPalette.map((color, index) => (
              <div
                key={index}
                className={`h-6 w-6 rounded-full border-2 border-white cursor-pointer ${color} ${
                  index === 1
                    ? "shadow-lg ring-4 ring-purple-300"
                    : "ring-1 ring-gray-300" // Màu active là màu tím
                }`}
              ></div>
            ))}
          </div>

          <div className="flex space-x-3 mb-4">
            {/* Nút Text */}
            <button
              className={`${baseButtonClass} flex-1 bg-white border border-gray-300 text-gray-700 hover:bg-gray-100`}
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Text
            </button>

            <button
              className={`${baseButtonClass} flex-1 bg-gray-100 border border-gray-300 text-gray-700 hover:bg-gray-200`}
            >
              <ImageIcon className="h-4 w-4 mr-2" />
              Photo/Video
            </button>
          </div>

          <button
            className={`${baseButtonClass} w-full text-white`}
            style={{
              backgroundImage:
                "linear-gradient(to right, #6d28d9, #9333ea, #a855f7)",
            }}
          >
            <Star className="h-5 w-5 mr-2 fill-white text-white" />
            Create Story
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateStoryModal;
