import React from "react";
import { FaArrowRight } from "react-icons/fa";
import { Link } from "react-router-dom";
import HighlightText from "../components/core/HomePage/HighlightText";
import CTAButton from"../components/core/HomePage/Button"
import Banner from "../assets/Images/banner.mp4"
const Home = () => {
  return (
    <div>
      {/* Section 1 */}
      <div className="relative mx-auto flex flex-col w-11/12 items-center text-white justify-between ">
        {" "}
        {/*This div is Section 1 div*/}
        <Link to={"/singup"}>
          {" "}
          {/*This Link is holding the Rounded button with Instructor And Arrow*/}
          <div
            className="group mt-16 p-1 mx-auto rounded-full bg-richblack-800 font-bold text-richblack-200
                transition-all duration-200 drop-shadow-[0_1.5px_rgba(255,255,255,0.25)] hover:scale-95 w-fit hover:drop-shadow-none"
          >
            {" "}
            {/*This div is the rounded div */}
            <div
              className="flex flex-row items-center gap-2 rounded-full px-10 py-[5px]
                    transition-all duration-200 group-hover:bg-richblack-900"
            >
              {" "}
              {/*This div is holding the Instructor text and and the arrow button*/}
              <p>Become an Instructor</p>
              <FaArrowRight />
            </div>
          </div>
        </Link>
        <div className="text-center text-4xl font-semibold mt-7">
          <p>
            Empower Your Future with
            <HighlightText text={" Coding Skills "} />
          </p>
        </div>
        <div className="mt-4 w-[90%] text-center text-lg font-bold text-richblack-300">
          With our online coding courses, you can learn at your own pace, from
          anywhere in the world, and get access to a wealth of resources,
          including hands-on projects, quizzes, and personalized feedback from
          instructors.
        </div>
        <div className="flex flex-row gap-7 mt-8">
            <CTAButton active={true} linkTo={"/signup"}>
              Learn More
            </CTAButton>
            <CTAButton active={false} linkTo={"/login"}>
              Book a Demo 
            </CTAButton>
            
        </div>
         {/* video Banner */}
        <div className="mx-3 my-14 shadow-[10px_-5px_50px_-5px] shadow-blue-200">
          <video className="shadow-[20px_20px_rgba(255,255,255)]" muted
          loop
          autoPlay>
            <source src={Banner} type="video/mp4"/>
          </video>
        </div>

        {/* Code Section 1 */}
        <div>
          <CodeBlocks/>
        </div>
      </div>
    </div>
  );
};

export default Home;
