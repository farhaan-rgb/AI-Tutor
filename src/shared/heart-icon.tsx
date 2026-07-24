/**
 * Brand currency / stat icons — the official Figma-exported artwork (Bits/Practice):
 *   • HeartIcon — Hearts currency, a faceted purple gem. `color` renders a flat
 *                 single-tone gem silhouette for on-colour surfaces (white on the
 *                 spin wheel / a reward medallion) where the gradient would blend.
 *   • FireIcon  — streak flame (orange→red gradient).
 *   • XpIcon    — the teal "XP" wordmark (single-colour, themeable via `color`).
 *
 * Multi-colour gem/flame keep their brand palette (icon assets, not theme tokens).
 * SVG ids are made unique per instance so several copies on one screen never collide.
 */

import { useId } from "react";

export function HeartIcon({ size = 16, color, style }: { size?: number; color?: string; style?: React.CSSProperties }) {
  const uid = useId().replace(/:/g, "");
  // Flat silhouette for on-colour surfaces.
  if (color) {
    return (
      <svg width={size} height={size} viewBox="0 0 22 22" fill="none" style={style} aria-hidden>
        <path d="M3.228 2.79H18.776L20.901 4.915V9.374L11.002 19.285L1.102 9.374V4.915L3.228 2.79Z" fill={color} />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 22 22" fill="none" style={style} aria-hidden>
      <path d="M7.41935 2.80652L11.0015 6.3936V10.13L6.30396 5.42588L7.41935 2.80652Z" fill="#AB7AE0" />
      <path d="M3.22803 2.78601L4.32279 5.42599H6.30443L7.41982 2.80664L3.22803 2.78601Z" fill="#CDA8F0" />
      <path d="M1.10205 4.91532L3.74203 6.00762L4.32283 5.42599L3.22806 2.78601L1.10205 4.91532Z" fill="#EBD7FA" />
      <path d="M1.10205 9.37392L3.74203 8.2808V6.00794L1.10205 4.91565V9.37392Z" fill="#AB7AE0" />
      <path d="M11.002 19.2851V15.5495L3.74203 8.27966L1.10205 9.37278L11.002 19.2851Z" fill="#642AB5" />
      <mask id={`hm0_${uid}`} style={{ maskType: "luminance" }} maskUnits="userSpaceOnUse" x="3" y="5" width="16" height="11">
        <path d="M17.6806 5.42566H15.6989L11.0014 10.1298L6.30389 5.42566H4.32225L3.74146 6.00728V8.28014L11.0014 15.55L18.2614 8.28014V6.00728L17.6806 5.42566Z" fill="white" />
      </mask>
      <g mask={`url(#hm0_${uid})`}>
        <path opacity="0.2" d="M13.7844 -3.72888V13.5845" stroke="#EBD7FA" strokeWidth="1.15499" strokeMiterlimit="10" />
        <path opacity="0.2" d="M14.7153 -4.82996V12.6228" stroke="#EBD7FA" strokeWidth="0.329998" strokeMiterlimit="10" />
        <path d="M17.6806 5.42529H15.6989L11.0014 10.1294L6.30389 5.42529H4.32225L3.74146 6.00692V8.27977L11.0014 15.5496L18.2614 8.27977V6.00692L17.6806 5.42529Z" fill="#854ECA" />
      </g>
      <mask id={`hm1_${uid}`} style={{ maskType: "luminance" }} maskUnits="userSpaceOnUse" x="11" y="2" width="5" height="9">
        <path d="M14.5833 2.80579L11.0012 6.39286V10.1293L15.6987 5.42514L14.5833 2.80579Z" fill="white" />
      </mask>
      <g mask={`url(#hm1_${uid})`}>
        <path opacity="0.2" d="M10.5007 4.06091L16.166 9.72533" stroke="#EBD7FA" strokeWidth="1.64999" strokeMiterlimit="10" />
        <path opacity="0.2" d="M11.1147 2.78528L16.78 8.45052" stroke="#EBD7FA" strokeWidth="0.329998" strokeMiterlimit="10" />
        <path d="M14.5841 2.80579L11.002 6.39286V10.1293L15.6995 5.42514L14.5841 2.80579Z" fill="#642AB5" />
      </g>
      <path d="M18.776 2.78601L17.6813 5.42599H15.6996L14.5842 2.80664L18.776 2.78601Z" fill="#AB7AE0" />
      <path d="M20.9014 4.91532L18.2615 6.00762L17.6807 5.42599L18.7754 2.78601L20.9014 4.91532Z" fill="#EBD7FA" />
      <path d="M20.9017 9.37392L18.2617 8.2808V6.00794L20.9017 4.91565V9.37392Z" fill="#CDA8F0" />
      <mask id={`hm2_${uid}`} style={{ maskType: "luminance" }} maskUnits="userSpaceOnUse" x="11" y="8" width="10" height="12">
        <path d="M11.0012 19.2853V15.5498L18.2612 8.27991L20.9012 9.37302L11.0012 19.2853Z" fill="white" />
      </mask>
      <g mask={`url(#hm2_${uid})`}>
        <path opacity="0.2" d="M11.7532 10.722L17.4184 16.3873" stroke="#EBD7FA" strokeWidth="1.64999" strokeMiterlimit="10" />
        <path opacity="0.2" d="M12.3691 9.44727L18.0336 15.1125" stroke="#EBD7FA" strokeWidth="0.329998" strokeMiterlimit="10" />
        <path d="M11.0012 19.2853V15.5498L18.2612 8.27991L20.9012 9.37302L11.0012 19.2853Z" fill="#AB7AE0" />
      </g>
    </svg>
  );
}

export function FireIcon({ size = 16, style }: { size?: number; style?: React.CSSProperties }) {
  const uid = useId().replace(/:/g, "");
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style} aria-hidden>
      <path d="M17.4903 11.2338C17.1594 10.4524 16.6784 9.75104 16.0773 9.17364L15.5812 8.69616C15.5644 8.68039 15.5441 8.6692 15.5222 8.66357C15.5003 8.65794 15.4774 8.65804 15.4555 8.66387C15.4336 8.6697 15.4134 8.68107 15.3967 8.69699C15.38 8.71291 15.3673 8.73289 15.3596 8.75517L15.1381 9.42221C15 9.84068 14.746 10.2681 14.3864 10.6883C14.3625 10.7152 14.3352 10.7223 14.3165 10.7241C14.2977 10.7259 14.2687 10.7223 14.2432 10.6973C14.2193 10.6758 14.2074 10.6436 14.2091 10.6114C14.2722 9.53488 13.9653 8.32061 13.2937 6.99905C12.7381 5.90103 11.9659 5.04443 11.0011 4.44713L10.2972 4.01257C10.2051 3.95534 10.0875 4.03045 10.0926 4.14312L10.1301 5.00151C10.1557 5.58807 10.0909 6.10668 9.9375 6.53767C9.75 7.06522 9.48068 7.55521 9.13636 7.99514C8.89674 8.30087 8.62515 8.57741 8.3267 8.81955C7.60791 9.39926 7.02343 10.1421 6.61704 10.9923C6.21166 11.85 6.00049 12.7944 6 13.7517C6 14.5958 6.15852 15.4131 6.47216 16.1838C6.775 16.9259 7.21203 17.5994 7.75909 18.1671C8.31136 18.7393 8.95227 19.19 9.66647 19.5029C10.4062 19.8284 11.1903 19.9929 12 19.9929C12.8097 19.9929 13.5937 19.8284 14.3335 19.5047C15.046 19.1936 15.6938 18.7399 16.2409 18.1688C16.7932 17.5966 17.2261 16.9278 17.5278 16.1856C17.841 15.4169 18.0016 14.5894 18 13.7535C18 12.8808 17.8295 12.0331 17.4903 11.2338Z" fill={`url(#fire0_${uid})`} />
      <mask id={`firem_${uid}`} style={{ maskType: "luminance" }} maskUnits="userSpaceOnUse" x="9" y="10" width="7" height="10">
        <path d="M12.6396 10.8532C12.1256 11.4509 11.8844 12.2437 11.8103 13.0576C11.7369 13.8755 12.0749 14.5824 11.3807 15.2836C11.0921 15.565 10.6182 15.4415 10.3495 15.1197C10.081 14.7979 9.9398 14.0843 9.89807 14.0638C9.85634 14.0432 9.73296 14.3784 9.63929 14.7434C9.55018 15.1043 9.16644 15.6106 9.15527 16.4155C9.1586 17.605 10.3878 19.0677 12.3087 19.0431C14.4113 19.0087 15.0031 17.4721 15.1061 17.1388C15.3557 16.4294 15.3493 15.3492 14.4949 14.2278C13.4706 12.5766 12.9993 11.5303 12.9452 10.967C12.8802 10.3866 12.7102 10.6225 12.6396 10.8532Z" fill={`url(#fire1_${uid})`} />
      </mask>
      <g mask={`url(#firem_${uid})`}>
        <path d="M12.4377 9.96936C11.9237 10.6166 11.6825 11.4753 11.6084 12.3568C11.535 13.2427 11.873 14.0083 11.1788 14.7678C10.8902 15.0726 10.4162 14.9388 10.1476 14.5903C9.8791 14.2418 9.73789 13.4689 9.69616 13.4466C9.65444 13.4244 9.53106 13.7873 9.43739 14.1827C9.34828 14.5735 8.96453 15.1219 8.95337 15.9937C8.9567 17.282 10.1859 18.8662 12.1068 18.8396C14.2094 18.8023 14.8012 17.138 14.9042 16.7771C15.1538 16.0087 15.1474 14.8388 14.293 13.6243C13.2687 11.8359 12.7974 10.7027 12.7433 10.0926C12.6783 9.46394 12.5083 9.71947 12.4377 9.96936Z" fill={`url(#fire2_${uid})`} />
      </g>
      <defs>
        <radialGradient id={`fire0_${uid}`} cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(11.8125 15.3679) scale(6.80322 9.07096)">
          <stop offset="0.32" stopColor="#FF9800" />
          <stop offset="0.5" stopColor="#FF8300" />
          <stop offset="0.67" stopColor="#FF6D00" />
          <stop offset="0.83" stopColor="#F9581B" />
          <stop offset="0.99" stopColor="#F44336" />
        </radialGradient>
        <radialGradient id={`fire1_${uid}`} cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(12.2937 10.6632) scale(10.0498 8.89429)">
          <stop offset="0.79" stopColor="white" />
          <stop offset="0.86" stopColor="white" stopOpacity="0.5" />
          <stop offset="0.94" stopColor="white" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`fire2_${uid}`} cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(12.0918 9.76359) scale(10.0498 9.63311)">
          <stop offset="0.21" stopColor="#FFF176" />
          <stop offset="0.35" stopColor="#FFF383" />
          <stop offset="0.48" stopColor="#FFF48F" />
          <stop offset="0.57" stopColor="#FFF7AA" />
          <stop offset="0.79" stopColor="#FFF9C4" />
          <stop offset="0.87" stopColor="#FFF59D" />
          <stop offset="0.94" stopColor="#FFF176" />
        </radialGradient>
      </defs>
    </svg>
  );
}

export function XpIcon({ size = 12, color = "var(--teal-500)", style }: { size?: number; color?: string; style?: React.CSSProperties }) {
  // 23:12 wordmark — height drives the scale.
  const w = Math.round((size * 23) / 12);
  return (
    <svg width={w} height={size} viewBox="0 0 23 12" fill="none" style={style} aria-hidden>
      <path d="M2.31683 0L5.45286 4.69336H5.55526L8.6913 0H10.9825L6.89928 6L11.0081 12H8.7041L5.55526 7.37109H5.45286L2.30403 12H0L4.17925 6L0.0256003 0H2.31683Z" fill={color} />
      <path d="M12.9441 12V0H17.6162C18.6359 0 19.4807 0.169922 20.1506 0.509765C20.8205 0.849609 21.3218 1.31445 21.6546 1.9043C21.9874 2.49023 22.1538 3.15039 22.1538 3.88477C22.1538 4.62305 21.9853 5.28711 21.6482 5.87695C21.3154 6.46289 20.812 6.92773 20.1378 7.27148C19.4679 7.61133 18.6253 7.78125 17.6098 7.78125H14.397V6.24609H17.4306C18.0749 6.24609 18.5975 6.14453 18.9986 5.94141C19.3997 5.73438 19.6941 5.45312 19.8818 5.09766C20.0696 4.74219 20.1634 4.33789 20.1634 3.88477C20.1634 3.43164 20.0696 3.0293 19.8818 2.67773C19.6941 2.32617 19.3975 2.05078 18.9922 1.85156C18.5911 1.65234 18.0621 1.55273 17.405 1.55273H14.9218V12H12.9441Z" fill={color} />
    </svg>
  );
}
