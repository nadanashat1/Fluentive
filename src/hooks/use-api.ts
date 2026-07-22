import { useState, useEffect } from "react";
import { safeFetch } from "../lib/api-client";
import { APIState, createErrorState, createLoadingState, createSuccessState } from "../types/api-state";

/**
 * Reality-First API Hook
 * 
 * Automatically handles loading, success, empty, and error states.
 * Never assumes data exists - always checks state before rendering.
 */
export function useAPI<T>(url: string, options?: RequestInit, dependencies: any[] = []) {
  const [state, setState] = useState<APIState<T>>(createLoadingState());
  const optionsKey = JSON.stringify(options ?? {});
  const dependenciesKey = JSON.stringify(dependencies ?? []);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      if (!isMounted) return;
      
      setState(createLoadingState());
      
      const result = await safeFetch<T>(url, options);
      
      if (isMounted) {
        setState(result === null ? createErrorState("Request failed") : createSuccessState(result));
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [url, optionsKey, dependenciesKey]);

  return state;
}

/**
 * Manual trigger version of useAPI
 * Useful for actions that need to be triggered on user interaction
 */
export function useAPIMutation<T>() {
  const [state, setState] = useState<APIState<T>>(createLoadingState());

  const mutate = async (url: string, options?: RequestInit) => {
    setState(createLoadingState());
    const result = await safeFetch<T>(url, options);
    setState(result === null ? createErrorState("Request failed") : createSuccessState(result));
    return result;
  };

  return { state, mutate };
}
