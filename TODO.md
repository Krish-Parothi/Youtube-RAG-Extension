# TODO: Implement Multi-Video Chat Sessions

## Overview
Extend the React + Chrome Extension (MV3) frontend to support multi-video chat sessions based on dynamic YouTube URL changes. Each video URL change should create or switch to a new chat session, preserving previous sessions in a sidebar.

## Steps
- [x] Create SessionSidebar component for listing previous sessions
- [x] Modify App.jsx to include sidebar layout and adjust main panel
- [x] Update useBackground.js to manage sessions as an object keyed by video ID
- [x] Implement session creation/switching on URL changes
- [x] Update storage to persist sessions per video ID
- [x] Ensure seamless integration with existing chat UI
- [x] Test URL change detection and session switching
- [x] Add URL_CHANGE message handler in background.js
- [x] Fix backend response field name (references instead of blocks)
- [x] Add migration from old single conversation to sessions
- [x] Ensure session creation even when side panel is not open
- [x] Fix loading state management and error handling
- [x] Fix URL change detection in content.js using History API and MutationObserver
- [x] Add tabs permission and GET_CURRENT_TAB_URL handler for fallback URL detection
- [x] Fix state.url synchronization in storage listener to prevent "No video URL detected" error
