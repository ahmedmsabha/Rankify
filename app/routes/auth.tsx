import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import { usePuterStore } from "~/lib/puter";

export function meta({}) {
  return [
    { title: "Rankify | Auth" },
    {
      name: "description",
      content: "Login to your Rankify account",
    },
  ];
}

export default function Auth() {
  const { isLoading, auth } = usePuterStore();
  const location = useLocation();
  const next = location.search.split("next=")[1];
  const navigate = useNavigate();

  useEffect(() => {
    if (auth.isAuthenticated) {
      navigate(next);
    }
  }, [next, auth.isAuthenticated]);

  return (
    <main className="bg-[url('/images/bg-auth.svg')] min-h-screen bg-cover flex items-center justify-center">
      <div className="gradient-border shadow-lg">
        <section className="flex flex-col gap-8 bg-white rounded-2xl p-10">
          <div className="flex flex-col gap-2 items-center text-center">
            <h1>Welcome</h1>
            <h2>Log In To Continue Your Job Journey</h2>
          </div>

          <div className="flex flex-col gap-2">
            {isLoading ? (
              <button className="primary-gradient rounded-full py-4 px-8 cursor-pointer w-[600px] max-md:w-full text-3xl font-semibold text-white animate-pulse">
                <p>Signing you in...</p>
              </button>
            ) : (
              <>
                {auth.isAuthenticated ? (
                  <button
                    className="primary-gradient rounded-full py-4 px-8 cursor-pointer w-[600px] max-md:w-full text-3xl font-semibold text-white"
                    onClick={() => auth.signOut()}
                  >
                    <p>Log Out</p>
                  </button>
                ) : (
                  <button
                    className="primary-gradient rounded-full py-4 px-8 cursor-pointer w-[600px] max-md:w-full text-3xl font-semibold text-white"
                    onClick={() => auth.signIn()}
                  >
                    <p>Log In</p>
                  </button>
                )}
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
