"use client";

import { createContext, useContext, ReactNode } from "react";

/**
 * Tenant-valgte hrefs som vises i enkel meny.
 * Null = bruk standard (alle med item.simple === true).
 */
export type SimpleMenuItemsConfig = string[] | null;

interface SimpleMenuConfigContextType {
  simpleMenuItems: SimpleMenuItemsConfig;
}

const SimpleMenuConfigContext = createContext<SimpleMenuConfigContextType | undefined>(undefined);

export function SimpleMenuConfigProvider({
  children,
  simpleMenuItems = null,
}: {
  children: ReactNode;
  simpleMenuItems?: SimpleMenuItemsConfig;
}) {
  return (
    <SimpleMenuConfigContext.Provider value={{ simpleMenuItems }}>
      {children}
    </SimpleMenuConfigContext.Provider>
  );
}

export function useSimpleMenuConfig() {
  const context = useContext(SimpleMenuConfigContext);
  if (context === undefined) {
    return { simpleMenuItems: null as SimpleMenuItemsConfig };
  }
  return context;
}
