import { assets } from "../assets/assets";

const Login = () => {
  return (
    // Container chính: Đảm bảo nền (bgImage) hiển thị đằng sau mọi thứ
    <div className="relative min-h-screen  items-center p-4">
      <img
        src={assets.bgImage}
        alt="Background"
        className="absolute top-0 left-0 w-full h-full object-cover -z-10"
      />

      <div className=" flex-1 flex flex-col items-start justify-between p-6 md:p-10 ">
        <div>
          <img
            src={assets.logo}
            alt="Pingup Logo"
            className="h-12 object-contain"
          />
        </div>

        <div className="hidden md:flex md:w-1/2 lg:w-3/5 p-12 items-center ">
          <div className="text-left text-gray-800">
            <div className="flex items-center mb-4">
              <img
                src={assets.group_users}
                alt="Users"
                className="w-16 h-8 mr-2"
              />
              <span className="text-sm font-semibold">
                Used by 10k+ developers
              </span>
            </div>

            <h1 className="text-4xl lg:text-5xl font-extrabold leading-tight mb-4">
              More than just friends{" "}
              <span className="text-indigo-700">truly connect</span>
            </h1>

            <p className="text-lg">connect with global community on pingup.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
