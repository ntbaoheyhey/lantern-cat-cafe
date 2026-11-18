/** T-CXI-10 isolated layout experiment; adoption must preserve these exact rules. */
export const noticeCss = `
/* Keep recovery text above the world HP rows without covering battle controls. */
.battle-v3-active .dp-loading.dp-scene-error { justify-content: flex-start; padding: 68px 24px 24px; text-align: center; }
.battle-v3-active .dp-scene-error > span { max-width: min(100%, 520px); overflow-wrap: anywhere; }
`;
