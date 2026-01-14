// src/hooks/useForecast.js
import { useEffect, useMemo, useState } from "react";
import { getForecast } from "../lib/forecastCache";
import { scoreDay } from "../lib/scoring";

async function fetchForecast({ lat, lon }) {
  return getForecast({ lat, lon });
}

function useForecast(lat, lon) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (lat == null || lon == null) return;
    let aborted = false;

    setLoading(true);
    setError(null);

    fetchForecast({ lat, lon })
      .then((j) => !aborted && setData(j))
      .catch((e) => !aborted && setError(e))
      .finally(() => !aborted && setLoading(false));

    return () => {
      aborted = true;
    };
  }, [lat, lon]);

  const rows = useMemo(() => {
    if (!data?.daily) return [];
    const {
      time,
      temperature_2m_max,
      temperature_2m_min,
      precipitation_sum,
      wind_speed_10m_max,
      weathercode,
    } = data.daily;

    return time.map((t, i) => {
      const row = {
        date: t,
        tmax: temperature_2m_max?.[i] ?? null,
        tmin: temperature_2m_min?.[i] ?? null,
        rain: precipitation_sum?.[i] ?? null,
        windMax: wind_speed_10m_max?.[i] ?? null,
        code: weathercode?.[i] ?? null,
      };
      const s = scoreDay(row);
      return {
        ...row,
        class: s.finalClass,
        points: s.points,
        basePts: s.basePts,
        windPen: s.windPen,
        rainPen: s.rainPen,
      };
    });
  }, [data]);

  return { data, rows, loading, error };
}

export { useForecast};