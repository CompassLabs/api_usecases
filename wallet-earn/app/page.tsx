import Screens from "@/components/Screens";

export default async function Home() {
  return (
    <div className="w-screen h-screen flex flex-col items-center justify-center">
      <div className="relative max-w-[400px] w-full border-[10px] border-neutral-800 bg-neutral-50 h-full max-h-[800px] shadow-xl rounded-[42px] outline-3 outline-neutral-300 overflow-hidden px-2.5">
        <Screens />
      </div>
      <div className="flex justify-center mt-4">
        <a
          href="https://github.com/CompassLabs/api_usecases/tree/main/wallet-earn"
          target="_blank"
          rel="noopener noreferrer"
          className="text-neutral-400 hover:text-neutral-500 duration-150 underline"
        >
          Source code
        </a>
      </div>
    </div>
  );
}
