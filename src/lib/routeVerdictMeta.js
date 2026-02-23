// src/lib/routeVerdictMeta.js

export function getRouteVerdictMeta(verdict) {
  switch (verdict) {
    case "move":
      return {
        titleKey: "routeVerdictMoveTitle",
        bodyKey: "routeVerdictMoveBody",
        tone: "strongPositive",   // strong green
        icon: "arrowUpRight",     // þú velur icon system
      };

    case "consider":
      return {
        titleKey: "routeVerdictConsiderTitle",
        bodyKey: "routeVerdictConsiderBody",
        tone: "positive",         // lighter green / blue
        icon: "arrowRight",
      };

    case "stay":
    default:
      return {
        titleKey: "routeVerdictStayTitle",
        bodyKey: "routeVerdictStayBody",
        tone: "neutral",          // gray
        icon: "mapPin",
      };
  }
}