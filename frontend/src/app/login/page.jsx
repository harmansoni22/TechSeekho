import LoginForm from "@/app/components/Auth/LoginForm";

const LogIn = () => {
  return (
    <main className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      <div className="auth-bg-overlay">
        <div
          className="auth-blob auth-gradient"
          style={{
            top: "-6%",
            left: "-12%",
            width: 300,
            height: 300,
            borderRadius: "50%",
            background:
              "radial-gradient(circle at 30% 30%, rgba(78,135,233,0.55) 0%, rgba(137,78,233,0.30) 40%, rgba(99,102,241,0.12) 100%)",
            mixBlendMode: "screen",
            opacity: 0.6,
          }}
        />

        <div
          className="auth-blob auth-gradient"
          style={{
            bottom: "-10%",
            right: "-10%",
            width: 280,
            height: 280,
            borderRadius: "50%",
            background:
              "radial-gradient(circle at 70% 70%, rgba(6,182,212,0.45) 0%, rgba(124,58,237,0.30) 50%, rgba(14,165,233,0.06) 100%)",
            mixBlendMode: "screen",
            opacity: 0.5,
            animationDuration: "9s",
          }}
        />
      </div>

      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        <div className="px-6">
          <div
            className="login-hero rounded-2xl shadow-lg"
            style={{
              backgroundImage:
                "linear-gradient(120deg, rgba(63,94,251,0.55), rgba(252,70,107,0.45)), url('https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1400&q=80')",
            }}
            aria-hidden={false}
          >
            <div className="overlay" />
            <div className="content text-white">
              <h1 className="text-4xl font-extrabold mb-3">Welcome back</h1>
              <p className="mb-6 text-white/90">
                Sign in to access your dashboard and courses.
              </p>

              <ul className="space-y-2 text-sm opacity-95">
                <li>• Personalized course recommendations</li>
                <li>• Track progress & certificates</li>
                <li>• Community & peer support</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="px-6">
          <LoginForm />
        </div>
      </div>
    </main>
  );
};

export default LogIn;
