# Profile Card Animation Customization Notes

This Phase 1 preview keeps the original supplied animation unchanged. Future customization should happen in these locations:

1. Component file: `src/components/animation-preview/OriginalProfileCard.tsx`.
2. Preview route: `/animation-preview/profile-card`, registered in `src/App.tsx`.
3. Mock name: the `.name` span inside `OriginalProfileCard`.
4. Mock description: the `.about-me` span inside `OriginalProfileCard`.
5. Mock image/SVG: the inline SVG inside the `.profile-pic` element.
6. Social icons: the inline SVG elements inside `.social-links-container`.
7. Button label: the `.button` element text.
8. Card width and height: `.card` rules inside `StyledWrapper`.
9. Main colours: `.card`, `.profile-pic`, `.bottom`, `.bottom-bottom`, `.button`, and SVG fill rules inside `StyledWrapper` and the inline SVG.
10. Profile image transition: `.card .profile-pic`, `.card:hover .profile-pic`, `.card:hover .profile-pic img`, and `.card:hover .profile-pic svg`.
11. Bottom panel transition: `.card .bottom` and `.card:hover .bottom`.
12. Border-radius animation: `.card .profile-pic`, `.card:hover .profile-pic`, `.card:hover .profile-pic:hover`, `.card .bottom`, and `.card:hover .bottom`.
13. Hover timing: transition declarations in the hover selectors inside `StyledWrapper`.
14. Future props: replace the hard-coded name, description, social links, button label, and image/SVG with typed props after the reference animation is accepted.
15. Members page connection: import a customized Phase 2 component into the existing Members card flow only after mapping real member fields and confirming responsive/touch behavior.

Touch support is intentionally not added in Phase 1 because the supplied source is hover-based.
