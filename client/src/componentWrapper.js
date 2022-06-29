import {
  useNavigate,
  useParams,
  useLocation,
} from 'react-router-dom';
import {
  useRef,
} from "react";
import useDatabase from "./Database";


/*
 *A wrapper class to give passed React Components:
 * a router to navigate to other pages of the application,
 * parameter passing in the URL,
 * and a function to use the IndexedDB
 */
export const withWrapper = (Component) => {
  const Wrapper = (props) => {
    return (
      <Component
        navigate={useNavigate()}
        {...props}
        params={useParams()}
        useDatabase={useDatabase}
        location={useLocation()}
        useRef={useRef(null)}
        />
    );
  };
  
  return Wrapper;
};