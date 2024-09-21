import React from 'react'
import CTAButton from "./Button"
import HighlightText from './HighlightText'
import { FaArrowRight } from 'react-icons/fa'

const CodeBlocks = ({
    position, heading, subHeading, ctabtn1, ctabtn2, codeblock, backgroundGradient, codeColor
}) => {
  return (
    <div className={'flex ${position} my-20 justify-between gap-10'}>
       
       {/* Section 1 */}
       <div className='w-[50%] flex flex-col gap-8'>
        {heading}
        <div className='text-richblack-300 font-bold'>
            {subHeading}
        </div>

            {/* Buttons */}
        <div className='flex flex-rowgap-7 mt-7'>
        <CTAButton active={ctabtn1.active}>

        </CTAButton>
        </div>

       </div>
    </div>
  )
}

export default CodeBlocks
