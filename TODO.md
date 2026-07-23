1. Add ability to list all cameras on the system.
2. Add ability to pick which camera the rule goes on.
3. Add ability to name the button.
4. Add ability to choose the button icon.
5. Test creating a named button on a chosen camera.
6. Add ability to use a real analytic event instead of the test button.
7. Test a real analytic firing an event.
8. Add ability to save the posted JSON.
9. Add columns for event type, camera, and time.
10. Add gate counters (+1 / -1).
11. Add loiter start and end pairing with a duration.
12. Add an event key so retries do not double-count.
13. Add basic validation and timestamp sanity checks.
14. Test storing duplicate and out-of-order events.
15. Add a simple dashboard page listing recent events.
16. Add a chart of events over time.
17. Add more chart types (bar, gauge, pie, donut).
18. Add ability to choose what each chart measures.
19. Add ability to group and filter a chart (by camera, type, hour).
20. Add a chart builder to create and edit charts.
21. Add ability to show, hide, and reorder charts.
22. Add embeddable per-chart links.
23. Test embedding a chart on another page.
24. Add an API key required to post events.
25. Add the key into the ingest URL on the rule.
26. Test that posts without a valid key are rejected.
27. Add SSRF protection on the NX connection.
28. Add encryption for stored NX passwords and API keys.
29. Add user accounts and login.
30. Add roles (admin, client manager, client).
31. Add password reset and a forced first-login change.
32. Add login throttling and cross-origin protection.
33. Add multiple clients, each with its own endpoint and data.
34. Add per-client NX system and credentials.
35. Test that one client cannot see another client's data.
36. Add a camera thumbnail grid with search.
37. Add a stepped provisioning wizard (pick camera, then configure).
38. Add ability to create soft-trigger buttons from the app.
39. Add rule reconciliation to update or remove changed rules.
40. Add a docs and help page.
41. Add deploy to a custom domain.
42. Test the whole flow end to end with a real client.
