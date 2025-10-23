import { Image as ImageIcon } from "lucide-react";

const CreatePost = () => {
  const user = {
    name: "John Warren",
    handle: "@john_warren",
    avatar:
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=40",
  };

  const publishButtonClass =
    "px-6 py-2 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700 transition duration-150";
  const iconButtonClass =
    "text-gray-500 hover:text-purple-600 transition duration-150 cursor-pointer";

  return (
    <div className="min-h-screen bg-white md:bg-gray-50 p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Create Post</h1>
        <p className="text-gray-500 mt-1">Share your thoughts with the world</p>
      </div>

      <div className="max-w-xl mx-auto md:mx-0 bg-white p-6 rounded-xl shadow-lg border border-gray-100">
        {/* USER INFO */}
        <div className="flex items-center space-x-3 mb-4">
          <img
            src={user.avatar}
            alt={user.name}
            className="h-10 w-10 rounded-full object-cover border border-gray-200"
          />
          <div>
            <p className="text-gray-800 font-semibold text-sm">{user.name}</p>
            <p className="text-gray-500 text-xs">{user.handle}</p>
          </div>
        </div>

        {/* TEXTAREA FOR POST CONTENT */}
        <div className="py-2">
          <textarea
            className="w-full resize-none border-none focus:outline-none text-gray-700 placeholder-gray-400 text-lg"
            rows="3"
            placeholder="What's happening?"
          ></textarea>
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-gray-100 mt-2">
          {/* Image Icon Button */}
          <div className={iconButtonClass}>
            <ImageIcon className="h-6 w-6" />
          </div>

          <button className={publishButtonClass}>Publish Post</button>
        </div>
      </div>
    </div>
  );
};

export default CreatePost;
