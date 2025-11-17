import ConnectScreen from "@/components/ConnectScreen";
import Screens from "@/components/Screens";
import Screens2 from "@/components/Screens2";

export default async function Home() {
  return (
    <div className="w-screen h-screen flex flex-col items-center justify-center">
      <div className="relative max-w-[410px] w-full border-10 border-neutral-800 bg-neutral-50 h-full max-h-[800px] shadow-xl rounded-[42px] outline-3 outline-neutral-300 overflow-hidden px-2.5">
        {/* <div className="absolute z-10 top-5 left-1/2 -translate-x-1/2">
          <appkit-button />
        </div> */}
        {/* <Screens /> */}
        {/* <ConnectScreen /> */}
        <Screens2 />
      </div>
      {/* <div className="flex justify-center mt-4">
        <a
          href="https://github.com/CompassLabs/api_usecases/tree/main/wallet-earn"
          target="_blank"
          rel="noopener noreferrer"
          className="text-neutral-400 hover:text-neutral-500 duration-150 underline"
        >
          Source code
        </a>
      </div> */}
    </div>
  );
}
