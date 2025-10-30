# Quick Add Debug Guide

## Troubleshooting Steps

### 1. Check Console for Initialization
Open browser console (F12) and look for:
```
QuickAdd: Calendar ready, attaching listeners
```

If you don't see this, the QuickAdd isn't initializing properly.

### 2. Test Hover Detection
With console open, hover over empty calendar space. You should NOT see any errors.

### 3. Check Icon Element
In console, type:
```javascript
document.querySelector('.quick-add-icon')
```
Should return the icon element (not null).

### 4. Manual Test
In console, try:
```javascript
quickAdd.plusIcon.classList.add('visible');
quickAdd.plusIcon.style.left = '500px';
quickAdd.plusIcon.style.top = '500px';
```
The icon should appear on screen.

### 5. Check Event Listener
In console:
```javascript
calendar.daysGrid
```
Should return the grid element.

## Common Issues

### Issue: Icon doesn't appear
**Cause**: Hover delay (300ms)
**Solution**: Hover steadily for full 300ms

**Cause**: Hovering over event
**Solution**: Try completely empty space

**Cause**: CSS z-index conflict
**Solution**: Icon now uses z-index: 1001

### Issue: Icon appears but can't click
**Cause**: pointer-events: none when hidden
**Solution**: Should switch to auto when visible

### Issue: Console shows errors
**Check**: 
- Is calendar loaded?
- Is eventCRUD loaded?
- Are all scripts loading?

## Quick Fixes

### Reduce Hover Delay
In `quick-add.js` line 130:
```javascript
}, 100); // Faster - was 300ms
```

### Enable Debug Mode
In `quick-add.js`, add at top of handleMouseMove:
```javascript
console.log('Mouse move', { 
    isOverEvent: this.isOverEvent, 
    isDragging: dragManager?.isDragging 
});
```

### Force Show Icon
In console:
```javascript
quickAdd.showPlusIcon(500, 500);
```

## Testing Checklist

1. [ ] Open browser console
2. [ ] Look for "QuickAdd: Calendar ready" message
3. [ ] Hover over empty space for 1 second
4. [ ] Icon should appear
5. [ ] Icon should follow cursor
6. [ ] Click icon
7. [ ] Modal should open with correct time

## Manual Override

If still not working, try this in console:

```javascript
// Force create icon if missing
if (!quickAdd.plusIcon) {
    console.log('Creating icon manually');
    quickAdd.createPlusIcon();
}

// Force attach listeners
quickAdd.attachListeners();

// Test show
quickAdd.currentColumn = document.querySelector('.day-column');
quickAdd.currentTime = { hours: 14, minutes: 0, yPosition: 840 };
quickAdd.showPlusIcon(500, 500);
```

## Check CSS

View in browser DevTools:
1. Find `.quick-add-icon` element
2. Check computed styles
3. Verify:
   - `position: fixed`
   - `z-index: 1001`
   - `display: flex` when visible

## Check JavaScript Load Order

In console:
```javascript
// All should be defined
typeof calendar !== 'undefined'      // true
typeof eventCRUD !== 'undefined'     // true
typeof quickAdd !== 'undefined'      // true
```

## Still Not Working?

Try clearing browser cache:
1. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
2. Clear cache and reload
3. Try incognito/private window

Check browser console for ANY errors - they may be blocking initialization.

