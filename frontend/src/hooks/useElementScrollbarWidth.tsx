import * as React from 'react';

//https://www.robinwieruch.de/react-hook-scrollbar-width/

//I haven't actually tested to see if this hook actually works, I just copy pasted it from the link.
//It is not being used. It gets the scroll bar width but the problem is it gets
//it when there is no scrollbar aswell when I just want it to return 0

export default function useScrollbarWidth () {
  const didCompute = React.useRef(false);
  const widthRef = React.useRef(0);

  if (didCompute.current) return widthRef.current;

  // Creating invisible container
  const outer = document.createElement('div');
  outer.style.visibility = 'hidden';
  outer.style.overflow = 'scroll'; // forcing scrollbar to appear
  // @ts-ignore
  outer.style.msOverflowStyle = 'scrollbar'; // needed for WinJS apps
  document.body.appendChild(outer);

  // Creating inner element and placing it in the container
  const inner = document.createElement('div');
  outer.appendChild(inner);

  // Calculating difference between container's full width and the child width
  const scrollbarWidth = outer.offsetWidth - inner.offsetWidth;

  // Removing temporary elements from the DOM
  // @ts-ignore
  outer.parentNode.removeChild(outer);

  didCompute.current = true;
  widthRef.current = scrollbarWidth;

  return scrollbarWidth;
};