import { EntityTransfer } from '@linode/api-v4/lib/entity-transfers';
import { APIError } from '@linode/api-v4/lib/types';
import * as React from 'react';
import Accordion from 'src/components/Accordion';
import Hidden from 'src/components/core/Hidden';
import { makeStyles, Theme } from 'src/components/core/styles';
import TableBody from 'src/components/core/TableBody';
import TableHead from 'src/components/core/TableHead';
import TableRow from 'src/components/core/TableRow';
import DateTimeDisplay from 'src/components/DateTimeDisplay';
import Table from 'src/components/Table/Table_CMR';
import TableCell from 'src/components/TableCell';
import TableRowEmptyState from 'src/components/TableRowEmptyState/TableRowEmptyState_CMR';
import TableRowError from 'src/components/TableRowError/TableRowError_CMR';
import TableRowLoading from 'src/components/TableRowLoading/TableRowLoading_CMR';
import capitalize from 'src/utilities/capitalize';
import { pluralize } from 'src/utilities/pluralize';
// import ActionMenu from './TransfersPendingActionMenu';

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    marginTop: '2rem',
    '& .MuiAccordionDetails-root': {
      padding: 0
    }
  },
  table: {
    width: '100%'
  },
  cellContents: {
    paddingLeft: '1rem'
  },
  actionCell: {
    padding: 0,
    paddingRight: '0 !important'
  },
  link: {
    ...theme.applyLinkStyles,
    fontSize: '0.875rem'
  }
}));

interface Props {
  transferType: string;
  transfers?: EntityTransfer[];
  error: APIError[] | null;
  isLoading: boolean;
}

type CombinedProps = Props;

export const TransfersTable: React.FC<CombinedProps> = props => {
  const classes = useStyles();
  const { transferType, transfers, isLoading, error } = props;

  // const [cancelPendingDialogOpen, setCancelPendingDialogOpen] = React.useState(false);

  const transferTypeIsPending = transferType === 'pending';
  const transferTypeIsSent = transferType === 'sent';

  const tableHeaders = ['Token', 'Created', 'Entities']; // These are the base headers; Transfers Received will have only these columns.

  if (transferTypeIsSent) {
    tableHeaders.push('Status');
  }

  if (transferTypeIsPending) {
    tableHeaders.push('Expiry', ''); // Empty string for action column header
  }

  // const cancelPendingTransfer = (token: string) => {
  //   setCancelPendingDialogOpen(true);
  // }

  const renderTableContent = (
    loading: boolean,
    error: APIError[] | null,
    data?: EntityTransfer[]
  ) => {
    if (loading) {
      return <TableRowLoading colSpan={4} oneLine hasEntityIcon />;
    }

    if (error) {
      return <TableRowError colSpan={4} message={error[0].reason} />;
    }

    if (!data || data.length === 0) {
      return <TableRowEmptyState colSpan={4} />;
    }

    return data.map((entityTransfer, idx) =>
      renderTransferRow(entityTransfer, idx)
    );
  };

  const renderTransferRow = (transfer: EntityTransfer, idx: number) => {
    const entitiesBeingTransferred = transfer.entities;
    const entitiesAndTheirCounts = Object.entries(entitiesBeingTransferred);

    return (
      <TableRow key={`transfer-${idx}`}>
        <TableCell className={classes.cellContents} noWrap>
          <button
            className={classes.link}
            onClick={() => alert('Open Transfer Details modal')}
          >
            {transfer.token}
          </button>
        </TableCell>
        <Hidden smDown>
          <TableCell className={classes.cellContents}>
            <DateTimeDisplay value={transfer.created} />
          </TableCell>
        </Hidden>
        {transferTypeIsPending ? (
          <Hidden xsDown>
            <TableCell className={classes.cellContents} noWrap>
              {entitiesAndTheirCounts.map((entry, idx) => {
                return (
                  <span key={idx}>
                    {formatEntitiesCell(entry)}
                    <br />
                  </span>
                );
              })}
            </TableCell>
          </Hidden>
        ) : (
          <TableCell className={classes.cellContents} noWrap>
            {entitiesAndTheirCounts.map((entry, idx) => {
              return (
                <span key={idx}>
                  {formatEntitiesCell(entry)}
                  <br />
                </span>
              );
            })}
          </TableCell>
        )}
        {transferTypeIsPending ? (
          <>
            <TableCell className={classes.cellContents} noWrap>
              <DateTimeDisplay value={transfer.expiry} />
            </TableCell>
            <TableCell className={classes.actionCell}>
              Cancel
              {/* <ActionMenu
                onCancel={() => alert('Pending transfer canceled')}
                token={transfer.token}
              /> */}
            </TableCell>
          </>
        ) : null}
        {transferTypeIsSent ? (
          <TableCell className={classes.cellContents}>
            {capitalize(transfer.status)}
          </TableCell>
        ) : null}
      </TableRow>
    );
  };

  // Only show the Transfers Pending table if there are transfers pending.
  if (transferType === 'pending' && (transfers?.length === 0 || error)) {
    return null;
  }

  return (
    <div className={classes.root}>
      <Accordion
        heading={`Transfers ${capitalize(transferType)}`}
        defaultExpanded
      >
        <Table className={classes.table}>
          <TableHead>
            <TableRow>
              {tableHeaders.map(thisHeader =>
                thisHeader === 'Created' ? (
                  <Hidden smDown>
                    <TableCell
                      key={`transfer-token-table-header-${thisHeader}`}
                    >
                      {thisHeader}
                    </TableCell>
                  </Hidden>
                ) : thisHeader === 'Entities' && transferTypeIsPending ? (
                  <Hidden xsDown>
                    <TableCell
                      key={`transfer-token-table-header-${thisHeader}`}
                    >
                      {thisHeader}
                    </TableCell>
                  </Hidden>
                ) : (
                  <TableCell key={`transfer-token-table-header-${thisHeader}`}>
                    {thisHeader}
                  </TableCell>
                )
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {renderTableContent(isLoading, error, transfers)}
          </TableBody>
        </Table>
      </Accordion>
    </div>
  );
};

// TODO: write unit tests
export const formatEntitiesCell = (entityAndCount: [string, number[]]) => {
  const pluralEntity = capitalize(entityAndCount[0]);
  const singleEntity = capitalize(
    entityAndCount[0].substring(0, entityAndCount[0].length - 1)
  );

  const entityCount = entityAndCount[1].length;

  return `${pluralize(singleEntity, pluralEntity, entityCount)}`;
};

export default React.memo(TransfersTable);
