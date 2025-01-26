"use client";

import { useEffect } from 'react';

export function ClearSessionStorage() {
  useEffect(() => {
    sessionStorage.clear();
  }, []);

  return null;
}
