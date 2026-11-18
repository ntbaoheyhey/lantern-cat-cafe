/** T-CXI-10 isolated layout experiment; adoption must preserve these exact rules. */
export const noticeCss = `
/* Keep recovery text above the world HP rows without covering battle controls. */
.dp-loading.dp-scene-error { justify-content: flex-start; padding: 24px; text-align: center; }
.dp-scene-error > span { max-width: min(100%, 720px); overflow-wrap: anywhere; }
`;
