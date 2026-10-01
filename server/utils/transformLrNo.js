/**
 * Transforms lrNo strings from "6521/22" format to array of numbers [6521, 6522]
 * Handles rollover cases where the suffix should increment the prefix
 * Examples:
 *  "6521/22" -> [6521, 6522]
 *  "6526/27" -> [6526, 6527]
 *  "11298/308" -> [11298, 11308]
 *  "11298/08" -> [11298, 11308]
 *  "6529" -> [6529]
 */

const parseWithRollover = (baseNumStr, suffixStr) => {
  const baseNum = parseInt(baseNumStr, 10);
  const suffixLen = suffixStr.length;
  const modulus = Math.pow(10, suffixLen);
  const targetSuffix = parseInt(suffixStr, 10);

  // Find base prefix part
  let basePrefix = Math.floor(baseNum / modulus);
  let candidate = basePrefix * modulus + targetSuffix;

  // If candidate is smaller than baseNum (e.g. 11298 -> 11208), increment prefix
  if (candidate < baseNum) {
    candidate = (basePrefix + 1) * modulus + targetSuffix;
  }

  return candidate;
};

export const transformLrNoString = (value) => {
  if (!value) return [];

  const strValue = String(value).trim();

  // If already an array of numbers, return as is
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        const num = Number(item);
        return Number.isFinite(num) && Number.isInteger(num) ? num : null;
      })
      .filter((item) => item !== null);
  }

  // Handle slash-separated format (e.g., "6521/22" or "11298/308")
  if (strValue.includes("/")) {
    const parts = strValue.split("/").map((p) => p.trim());
    const baseNumStr = parts[0];
    const baseNum = parseInt(baseNumStr, 10);

    // If base is not a valid integer, return empty array
    if (!Number.isFinite(baseNum) || !Number.isInteger(baseNum)) {
      return [];
    }

    const resultArray = [baseNum];

    // Process suffix parts with rollover logic
    for (let i = 1; i < parts.length; i++) {
      const suffixStr = parts[i];
      if (!suffixStr) continue;

      const suffixNum = parseInt(suffixStr, 10);
      if (!Number.isFinite(suffixNum)) continue;

      const transformed = parseWithRollover(baseNumStr, suffixStr);
      resultArray.push(transformed);
    }

    return resultArray;
  }

  // Handle pipe-separated format (backward compatibility, e.g., "6521|6522")
  if (strValue.includes("|")) {
    return strValue
      .split("|")
      .map((item) => {
        const num = Number(item.trim());
        return Number.isFinite(num) && Number.isInteger(num) ? num : null;
      })
      .filter((item) => item !== null);
  }

  // Handle single number
  const singleNum = parseInt(strValue, 10);
  if (Number.isFinite(singleNum) && Number.isInteger(singleNum)) {
    return [singleNum];
  }

  return [];
};

export default transformLrNoString;
