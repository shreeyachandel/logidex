import React, { useState, useEffect } from "react";
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Paper,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Box,
} from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";

const TruthTable = ({ data }) => {
  const [visibleCount, setVisibleCount] = useState(10);
  const [anchorEls, setAnchorEls] = useState({});
  const [filters, setFilters] = useState({});

  useEffect(() => {
    // Ensures useEffect is not applied to the search string unless submitted
    if (!data) return; // Exit early if no data available
  }, [data]);

  const totalColumns = data?.inputs?.length + 1;

  const handleSeeMore = () => {
    setVisibleCount((prev) => prev + 10);
  };

  const handleFilterClick = (event, index) => {
    setAnchorEls((prev) => ({ ...prev, [index]: event.currentTarget }));
  };

  const handleFilterClose = (index) => {
    setAnchorEls((prev) => ({ ...prev, [index]: null }));
  };

  const handleFilterSelect = (index, value) => {
    setFilters((prev) => ({ ...prev, [index]: value }));
    handleFilterClose(index);
  };

  const clearFilter = (index) => {
    setFilters((prev) => {
      const newFilters = { ...prev };
      delete newFilters[index];
      return newFilters;
    });
    handleFilterClose(index);
  };

  const clearAllFilters = () => {
    setFilters({});
  };

  const filteredTable = Object.entries(filters).length
    ? data?.table?.filter((rowObj) =>
        Object.entries(filters).every(([colIndex, value]) => {
          return rowObj.row[parseInt(colIndex)] === value;
        })
      )
    : data?.table;

  const visibleRows = filteredTable?.slice(0, visibleCount);
  const totalRows = data?.table?.length;
  const filteredCount = filteredTable?.length;
  const trueCount = filteredTable?.filter(
    (row) => row.row[totalColumns - 1] === 1
  ).length;
  const falseCount = filteredCount - trueCount;

  return (
    <div style={{ padding: "1rem" }}>
      <Typography variant="h6" gutterBottom>
        Generated Truth Table
      </Typography>

      <Box display="flex" alignItems="center" gap={2} mb={2}>
        <Typography variant="body2">
          Rows Generated: <strong>{filteredCount}/{totalRows}</strong>
        </Typography>

        <Button variant="text" size="small" color="error" onClick={clearAllFilters}>
  Clear All Filters
</Button>


      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              {data?.inputs?.map((input, index) => {
                const colCounts = { 0: 0, 1: 0 };
                filteredTable.forEach((row) => {
                  colCounts[row.row[index]]++;
                });

                return (
                  <TableCell key={index} align="center" sx={{ fontWeight: "bold" }}>
                    <Box display="flex" alignItems="center" justifyContent="center" flexDirection="column">
                      <Box display="flex" alignItems="center">
                        {input}
                        <IconButton
                          size="small"
                          onClick={(e) => handleFilterClick(e, index)}
                        >
                          <FilterListIcon fontSize="small" />
                          {filters[index] !== undefined && (
                            <sub style={{ marginLeft: "2px" }}>{filters[index]}</sub>
                          )}
                        </IconButton>
                      </Box>
                      <Typography variant="caption" color="textSecondary">
                        false: {colCounts[0]} | true: {colCounts[1]}
                      </Typography>
                      <Menu
                        anchorEl={anchorEls[index]}
                        open={Boolean(anchorEls[index])}
                        onClose={() => handleFilterClose(index)}
                      >
                        <MenuItem onClick={() => handleFilterSelect(index, 0)}>0</MenuItem>
                        <MenuItem onClick={() => handleFilterSelect(index, 1)}>1</MenuItem>
                        <MenuItem onClick={() => clearFilter(index)} sx={{ fontStyle: "italic" }}>
                          Clear Filter
                        </MenuItem>
                      </Menu>
                    </Box>
                  </TableCell>
                );
              })}

              {/* Output Column */}
              <TableCell align="center" sx={{ fontWeight: "bold", backgroundColor: "#f5f5dc" }}>
                <Box display="flex" alignItems="center" justifyContent="center" flexDirection="column">
                  <Box display="flex" alignItems="center">
                    Output
                    <IconButton
                      size="small"
                      onClick={(e) => handleFilterClick(e, totalColumns - 1)}
                    >
                      <FilterListIcon fontSize="small" />
                      {filters[totalColumns - 1] !== undefined && (
                        <sub style={{ marginLeft: "2px" }}>{filters[totalColumns - 1]}</sub>
                      )}
                    </IconButton>
                  </Box>
                  <Typography variant="caption" color="textSecondary">
                    false: {falseCount} | true: {trueCount}
                  </Typography>
                  <Menu
                    anchorEl={anchorEls[totalColumns - 1]}
                    open={Boolean(anchorEls[totalColumns - 1])}
                    onClose={() => handleFilterClose(totalColumns - 1)}
                  >
                    <MenuItem onClick={() => handleFilterSelect(totalColumns - 1, 0)}>0</MenuItem>
                    <MenuItem onClick={() => handleFilterSelect(totalColumns - 1, 1)}>1</MenuItem>
                    <MenuItem onClick={() => clearFilter(totalColumns - 1)} sx={{ fontStyle: "italic" }}>
                      Clear Filter
                    </MenuItem>
                  </Menu>
                </Box>
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {visibleRows?.map((rowObj, rowIndex) => (
              <TableRow
                key={rowIndex}
                sx={{
                  backgroundColor: rowObj.highlighted ? "#cceeff" : "inherit",
                }}
              >
                {rowObj.row.map((cell, cellIndex) => (
                  <TableCell
                    key={cellIndex}
                    align="center"
                    sx={{
                      backgroundColor:
                        cellIndex === totalColumns - 1 ? "#f5f5dc" : "inherit",
                    }}
                  >
                    {cell}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {visibleCount < filteredTable.length && (
        <Button
          onClick={handleSeeMore}
          variant="outlined"
          sx={{ marginTop: "1rem" }}
        >
          See More Rows
        </Button>
      )}
    </div>
  );
};

export default TruthTable;
