// src/lib/routeVerdictText.js

export function getVerdictI18nKeys(verdict) {
  switch (verdict) {
    case "move":
      return {
        titleKey: "routeVerdictMoveTitle",
        bodyKey: "routeVerdictMoveBody",
      };
    case "consider":
      return {
        titleKey: "routeVerdictConsiderTitle",
        bodyKey: "routeVerdictConsiderBody",
      };
    case "stay":
    default:
      return {
        titleKey: "routeVerdictStayTitle",
        bodyKey: "routeVerdictStayBody",
      };
  }
}