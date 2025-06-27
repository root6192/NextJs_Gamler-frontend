'use client';

import { IconChevronLgDown, IconHamburger } from '@intentui/icons';
import {
  Button,
  Cell,
  type CellProps,
  Collection,
  Column,
  type ColumnProps,
  ColumnResizer as ColumnResizerPrimitive,
  type ColumnResizerProps,
  type TableHeaderProps as HeaderProps,
  ResizableTableContainer,
  Row,
  type RowProps,
  TableBody as TableBodyPrimitive,
  type TableBodyProps,
  TableHeader as TableHeaderPrimitive,
  Table as TablePrimitive,
  type TableProps as TablePrimitiveProps,
  composeRenderProps,
  useTableOptions,
} from 'react-aria-components';

import { composeTailwindRenderProps } from '@shared/lib/primitive';
import { Checkbox } from '@ui/checkbox';
import { createContext, use } from 'react';
import { twJoin, twMerge } from 'tailwind-merge';

interface TableProps extends Omit<TablePrimitiveProps, 'className'> {
  allowResize?: boolean;
  className?: string;
  bleed?: boolean;
  ref?: React.Ref<HTMLTableElement>;
}

const TableContext = createContext<TableProps>({
  allowResize: false,
});

const useTableContext = () => use(TableContext);

const Root = (props: TableProps) => {
  return (
    <TablePrimitive
      className='w-full min-w-full caption-bottom text-sm/6 outline-hidden [--table-selected-bg:var(--color-secondary)]/50'
      {...props}
    />
  );
};

const Table = ({ allowResize, className, bleed, ref, ...props }: TableProps) => {
  return (
    <TableContext.Provider value={{ allowResize, bleed }}>
      <div className='flow-root'>
        <div
          className={twMerge(
            'relative -mx-(--gutter) overflow-x-auto whitespace-nowrap [--gutter-y:--spacing(2)] has-data-[slot=table-resizable-container]:overflow-auto',
            className,
          )}>
          <div className={twJoin('inline-block min-w-full align-middle')}>
            {allowResize ? (
              <ResizableTableContainer data-slot='table-resizable-container'>
                <Root ref={ref} {...props} />
              </ResizableTableContainer>
            ) : (
              <Root {...props} ref={ref} />
            )}
          </div>
        </div>
      </div>
    </TableContext.Provider>
  );
};

const ColumnResizer = ({ className, ...props }: ColumnResizerProps) => (
  <ColumnResizerPrimitive
    {...props}
    className={composeTailwindRenderProps(
      className,
      '&[data-resizable-direction=left]:cursor-e-resize &[data-resizable-direction=right]:cursor-w-resize [&[data-resizing]>div]:bg-primary absolute top-0 right-0 bottom-0 grid w-px touch-none place-content-center px-1 data-[resizable-direction=both]:cursor-ew-resize',
    )}>
    <div className='bg-border h-full w-px' />
  </ColumnResizerPrimitive>
);

const TableBody = <T extends object>(props: TableBodyProps<T>) => <TableBodyPrimitive data-slot='table-body' {...props} />;

interface TableColumnProps extends ColumnProps {
  className?: string;
  isResizable?: boolean;
}

const TableColumn = ({ isResizable = false, className, ...props }: TableColumnProps) => {
  const { bleed } = useTableContext();
  return (
    <Column
      data-slot='table-column'
      {...props}
      className={composeTailwindRenderProps(
        className,
        twJoin(
          'font-normal text-black/85',
          'allows-sorting:cursor-default relative outline-hidden data-dragging:cursor-grabbing',
          'before:absolute before:top-1/2 before:-right-0 before:h-[1.6em] before:w-[1px] before:-translate-y-1/2 before:border-l before:border-black/10',
          !bleed ? 'sm:first:pl-1 sm:last:pr-1' : 'p-5',
          isResizable && 'truncate overflow-hidden',
        ),
      )}>
      {(values) => (
        <div className='flex items-end gap-2 **:data-[slot=icon]:shrink-0'>
          <>
            {typeof props.children === 'function' ? props.children(values) : props.children}
            {values.allowsSorting && (
              <span
                className={twMerge(
                  'bg-secondary text-fg grid size-[1.15rem] flex-none shrink-0 place-content-center rounded *:data-[slot=icon]:size-3.5 *:data-[slot=icon]:shrink-0 *:data-[slot=icon]:transition-transform *:data-[slot=icon]:duration-200',
                  values.isHovered ? 'bg-secondary-fg/10' : '',
                  className,
                )}>
                <IconChevronLgDown className={values.sortDirection === 'ascending' ? 'rotate-180' : ''} />
              </span>
            )}
            {isResizable && <ColumnResizer />}
          </>
        </div>
      )}
    </Column>
  );
};

interface TableHeaderProps<T extends object> extends HeaderProps<T> {
  ref?: React.Ref<HTMLTableSectionElement>;
}

const TableHeader = <T extends object>({ children, ref, columns, className, ...props }: TableHeaderProps<T>) => {
  const { bleed } = useTableContext();
  const { selectionBehavior, selectionMode, allowsDragging } = useTableOptions();
  return (
    <TableHeaderPrimitive data-slot='table-header' className={composeTailwindRenderProps(className, 'border-b')} ref={ref} {...props}>
      {allowsDragging && (
        <Column
          data-slot='table-column'
          className={twMerge(
            'w-0 max-w-8 px-4 first:pl-(--gutter,--spacing(2)) last:pr-(--gutter,--spacing(2))',
            !bleed && 'sm:first:pl-1 sm:last:pr-1',
          )}
        />
      )}
      {selectionBehavior === 'toggle' && (
        <Column
          data-slot='table-column'
          className={twMerge(
            'w-0 max-w-8 px-4 first:pl-(--gutter,--spacing(2)) last:pr-(--gutter,--spacing(2))',
            !bleed && 'sm:first:pl-1 sm:last:pr-1',
          )}>
          {selectionMode === 'multiple' && <Checkbox slot='selection' />}
        </Column>
      )}
      <Collection items={columns}>{children}</Collection>
    </TableHeaderPrimitive>
  );
};

interface TableRowProps<T extends object> extends RowProps<T> {
  ref?: React.Ref<HTMLTableRowElement>;
}

const TableRow = <T extends object>({ children, className, columns, id, ref, ...props }: TableRowProps<T>) => {
  const { selectionBehavior, allowsDragging } = useTableOptions();
  return (
    <Row
      ref={ref}
      data-slot='table-row'
      id={id}
      {...props}
      className={composeRenderProps(className, (className, { isSelected, selectionMode, isFocusVisibleWithin, isDragging, isDisabled }) =>
        twMerge(
          'group text-muted-fg ring-primary relative cursor-default border-b outline-transparent last:border-b-0',
          isDragging && 'outline outline-blue-500',
          isSelected && 'text-fg bg-(--table-selected-bg) hover:bg-(--table-selected-bg)/50',
          (props.href || props.onAction || selectionMode === 'multiple') && 'hover:text-fg hover:bg-(--table-selected-bg)',
          (props.href || props.onAction || selectionMode === 'multiple') &&
            isFocusVisibleWithin &&
            'selected:bg-(--table-selected-bg)/50 text-fg bg-(--table-selected-bg)/50',
          isDisabled && 'opacity-50',
          className,
        ),
      )}>
      {allowsDragging && (
        <TableCell className='dragging:cursor-grabbing ring-primary cursor-grab'>
          <Button
            slot='drag'
            className='focus-visible:ring-ring grid place-content-center rounded-xs px-[calc(var(--gutter)/2)] outline-hidden focus-visible:ring'>
            <IconHamburger />
          </Button>
        </TableCell>
      )}
      {selectionBehavior === 'toggle' && (
        <TableCell>
          <Checkbox slot='selection' />
        </TableCell>
      )}
      <Collection items={columns}>{children}</Collection>
    </Row>
  );
};

const TableCell = ({ className, ...props }: CellProps) => {
  const { allowResize, bleed } = useTableContext();
  return (
    <Cell
      data-slot='table-cell'
      {...props}
      className={composeTailwindRenderProps(
        className,
        twJoin(
          'group group-has-data-focus-visible-within:text-fg align-middle text-black/85 outline-hidden',
          !bleed ? 'sm:first:pl-1 sm:last:pr-1' : 'p-5',
          allowResize && 'truncate overflow-hidden',
        ),
      )}
    />
  );
};

Table.Body = TableBody;
Table.Cell = TableCell;
Table.Column = TableColumn;
Table.Header = TableHeader;
Table.Row = TableRow;

export { Table };
export type { TableColumnProps, TableProps, TableRowProps };
