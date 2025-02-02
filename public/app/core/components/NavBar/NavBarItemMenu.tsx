import React, { ReactElement, useEffect, useRef } from 'react';
import { css } from '@emotion/css';
import { useTheme2 } from '@grafana/ui';
import { GrafanaTheme2, NavMenuItemType, NavModelItem } from '@grafana/data';
import { SpectrumMenuProps } from '@react-types/menu';
import { useMenu } from '@react-aria/menu';
import { useTreeState } from '@react-stately/tree';
import { mergeProps } from '@react-aria/utils';

import { getNavModelItemKey } from './utils';
import { useNavBarItemMenuContext } from './context';
import { NavBarItemMenuItem } from './NavBarItemMenuItem';

export interface NavBarItemMenuProps extends SpectrumMenuProps<NavModelItem> {
  onNavigate: (item: NavModelItem) => void;
  adjustHeightForBorder: boolean;
  reverseMenuDirection?: boolean;
}

export function NavBarItemMenu(props: NavBarItemMenuProps): ReactElement | null {
  const { reverseMenuDirection, adjustHeightForBorder, disabledKeys, onNavigate, ...rest } = props;
  const contextProps = useNavBarItemMenuContext();
  const completeProps = {
    ...mergeProps(contextProps, rest),
  };
  const { menuHasFocus, menuProps: contextMenuProps = {} } = contextProps;
  const theme = useTheme2();
  const styles = getStyles(theme, adjustHeightForBorder, reverseMenuDirection);
  const state = useTreeState<NavModelItem>({ ...rest, disabledKeys });
  const ref = useRef(null);
  const { menuProps } = useMenu(completeProps, { ...state }, ref);
  const allItems = [...state.collection];
  const items = allItems.filter((item) => item.value.menuItemType === NavMenuItemType.Item);
  const section = allItems.find((item) => item.value.menuItemType === NavMenuItemType.Section);

  useEffect(() => {
    if (menuHasFocus && !state.selectionManager.isFocused) {
      state.selectionManager.setFocusedKey(section?.key ?? '');
      state.selectionManager.setFocused(true);
    } else if (!menuHasFocus) {
      state.selectionManager.setFocused(false);
      state.selectionManager.setFocusedKey('');
      state.selectionManager.clearSelection();
    }
  }, [menuHasFocus, state.selectionManager, reverseMenuDirection, section?.key]);

  if (!section) {
    return null;
  }

  const menuSubTitle = section.value.subTitle;

  const sectionComponent = (
    <NavBarItemMenuItem
      className={styles.section}
      key={section.key}
      item={section}
      state={state}
      onNavigate={onNavigate}
    />
  );

  const subTitleComponent = (
    <li key={menuSubTitle} className={styles.menuItem}>
      <div className={styles.subtitle}>{menuSubTitle}</div>
    </li>
  );

  return (
    <ul
      className={`${styles.menu} navbar-dropdown`}
      ref={ref}
      {...mergeProps(menuProps, contextMenuProps)}
      tabIndex={menuHasFocus ? 0 : -1}
    >
      {!reverseMenuDirection ? sectionComponent : null}
      {menuSubTitle && reverseMenuDirection ? subTitleComponent : null}
      {items.map((item, index) => {
        return (
          <NavBarItemMenuItem key={getNavModelItemKey(item.value)} item={item} state={state} onNavigate={onNavigate} />
        );
      })}
      {reverseMenuDirection ? sectionComponent : null}
      {menuSubTitle && !reverseMenuDirection ? subTitleComponent : null}
    </ul>
  );
}

function getStyles(
  theme: GrafanaTheme2,
  adjustHeightForBorder: boolean,
  reverseDirection?: boolean,
  isFocused?: boolean
) {
  return {
    menu: css`
      background-color: ${theme.colors.background.primary};
      border: 1px solid ${theme.components.panel.borderColor};
      bottom: ${reverseDirection ? 0 : 'auto'};
      box-shadow: ${theme.shadows.z3};
      display: flex;
      flex-direction: column;
      left: 100%;
      list-style: none;
      min-width: 140px;
      position: absolute;
      top: ${reverseDirection ? 'auto' : 0};
      transition: ${theme.transitions.create('opacity')};
      z-index: ${theme.zIndex.sidemenu};
      list-style: none;
    `,
    menuItem: css`
      background-color: ${isFocused ? theme.colors.action.hover : 'transparent'};
      color: ${isFocused ? 'white' : theme.colors.text.primary};

      &:focus-visible {
        background-color: ${theme.colors.action.hover};
        box-shadow: none;
        color: ${theme.colors.text.primary};
        outline: 2px solid ${theme.colors.primary.main};
        // Need to add condition, header is 0, otherwise -2
        outline-offset: -0px;
        transition: none;
      }
    `,
    subtitle: css`
      border-${reverseDirection ? 'bottom' : 'top'}: 1px solid ${theme.colors.border.weak};
      color: ${theme.colors.text.secondary};
      font-size: ${theme.typography.bodySmall.fontSize};
      font-weight: ${theme.typography.bodySmall.fontWeight};
      padding: ${theme.spacing(1)} ${theme.spacing(2)} ${theme.spacing(1)};
      white-space: nowrap;
    `,
    section: css`
      background-color: ${theme.colors.background.secondary};
    `,
  };
}
