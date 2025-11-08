
import React from "react";
const MadeByHumans = () => {
  return <section id="made-by-humans" className="w-full bg-white dark:bg-gray-900 py-8 md:py-12 transition-colors duration-300">
      <div className="section-container animate-on-scroll pb-4">
        {/* Removed the pulse-chip button/element that was here */}
        
        <div className="w-full rounded-xl sm:rounded-2xl overflow-hidden relative mt-4 sm:mt-6">
          <div className="bg-no-repeat bg-cover bg-center p-3 sm:p-4 min-h-[200px] sm:min-h-[280px] flex flex-col justify-between" style={{
          backgroundImage: "url('/background-section3.png')"
        }}>
            <div className="flex items-center text-white">
              <span className="text-white text-xl font-bold">NEXORA</span>
            </div>
            
            <div style={{
            overflow: "hidden",
            maxHeight: "60px",
            marginTop: "30px"
          }}>
              <h2 style={{
              marginBottom: "-20px",
              padding: "0px 0px 80px"
            }} className="sm:text-3xl font-playfair text-white italic mt-0 mx-0 font-thin text-4xl md:text-5xl py-0 px-0 text-center lg:text-5xl">
                Powered By AI, Built For Humans
              </h2>
            </div>
            
            {/* White box at the bottom with overflow */}
            <div className="w-[120%] bg-white dark:bg-gray-900 h-8 rounded-t-lg absolute left-[-10%] bottom-0"></div>
          </div>
        </div>
      </div>
    </section>;
};
export default MadeByHumans;
