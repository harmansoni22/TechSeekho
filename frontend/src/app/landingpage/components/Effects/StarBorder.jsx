const StarBorder = ({
  as: Component = "button",
  className = "",
  color = "white",
  speed = "6s",
  thickness = 1,
  children,
  background = "transparent",
  gradient = false,
  ...rest
}) => {
  return (
    <Component
      className={`
                    relative 
                    inline-block 
                    overflow-hidden 
                    rounded-[20px] 
                    ${className}
                `}
      style={{
        padding: `${thickness}px 0`,
        ...rest.style,
      }}
      {...rest}
    >
      <div
        className="
                    absolute 
                    w-[300%] 
                    h-[50%] 
                    opacity-70 
                    bottom-[-11px] 
                    right-[-250%] 
                    rounded-full 
                    animate-star-movement-bottom 
                    z-1
                "
        style={{
          background: `
                        radial-gradient(
                            circle, 
                            ${color}, 
                            transparent 10%
                        )
                    `,
          // animationDuration: speed
          animation: `star-movement-bottom ${speed} linear infinite alternate`,
        }}
      ></div>
      <div
        className="
                    absolute 
                    w-[300%] 
                    h-[50%] 
                    opacity-70 
                    top-[-10px] 
                    left-[-250%] 
                    rounded-full 
                    animate-star-movement-top
                "
        style={{
          background: `
                            radial-gradient(
                                circle, 
                                ${color}, 
                                transparent 10%
                            )
                        `,
          // animationDuration: speed
          animation: `star-movement-top ${speed} linear infinite alternate`,
        }}
      ></div>
      <div
        className={`
                        relative 
                        z-1 
                        border 
                        border-gray-800 
                        text-white 
                        text-center 
                        text-[16px] 
                        py-[16px] 
                        px-[26px] 
                        rounded-[20px]
                    `}
        style={
          gradient === true
            ? {
                backgroundImage: "linear-gradient(to bottom, black, gray)",
              }
            : {
                background: background,
              }
        }
      >
        {children}
      </div>
    </Component>
  );
};

export default StarBorder;
