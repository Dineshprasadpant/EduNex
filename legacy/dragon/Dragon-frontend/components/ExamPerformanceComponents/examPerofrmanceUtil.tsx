import { PerformanceDetails, PerformanceSummary, RecurringTopPerformer, ExportRecordResponse } from './examPerformanceTypes';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export const identifyRecurringTopPerformers = (data: PerformanceDetails[]): RecurringTopPerformer[] => {
  // Extract all top performers from all exams with proper name handling
  const allTopPerformers = data.flatMap(performance =>
    performance.highestScorers.map(scorer => ({
      studentId: scorer.studentId?._id || 'unknown',
      studentName: scorer.studentId?.fullname || 'Unknown Student',
      examId: performance.examId?._id || 'unknown',
      examTitle: performance.examId?.title || 'Unknown Exam',
      percentage: scorer.percentage,
      academicYear: performance.academicYear,
      date: new Date(performance.createdAt).toLocaleDateString()
    }))
  );

  // Count occurrences of each student
  const studentOccurrences: Record<string, {
    count: number;
    name: string;
    appearances: {
      examId: string;
      examTitle: string;
      percentage: number;
      academicYear: string;
      date: string;
    }[];
  }> = {};

  allTopPerformers.forEach(performer => {
    const studentId = performer.studentId;
    if (!studentOccurrences[studentId]) {
      studentOccurrences[studentId] = {
        count: 0,
        name: performer.studentName,
        appearances: []
      };
    }
    studentOccurrences[studentId].count += 1;
    studentOccurrences[studentId].appearances.push({
      examId: performer.examId,
      examTitle: performer.examTitle,
      percentage: performer.percentage,
      academicYear: performer.academicYear,
      date: performer.date
    });
  });

  // Filter for students who appear more than once and include names
  const recurringPerformers = Object.entries(studentOccurrences)
    .filter(([_, data]) => data.count > 1)
    .map(([studentId, data]) => ({
      studentId: studentId === 'unknown' ? null : studentId,
      studentName: data.name,
      occurrences: data.count,
      appearances: data.appearances
    }))
    .sort((a, b) => b.occurrences - a.occurrences);

  return recurringPerformers;
};

export const formatProgressionData = (data: PerformanceSummary[]) => {
  // Sort by date and handle missing titles
  const sortedData = [...data].sort((a, b) =>
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  return sortedData.map((item, index) => ({
    name: item.examId?.title || `Exam ${index + 1}`,
    date: new Date(item.createdAt).toLocaleDateString(),
    percentage: item.overallPercentage,
    examinees: item.numberOfExaminees,
    batchName: item.batchId?.batch_name || 'Unknown Batch'
  }));
};

export const formatChartData = (data: PerformanceSummary[]) => {
  return data.map(item => ({
    name: item.examId?.title || 'Overall',
    percentage: item.overallPercentage,
    examinees: item.numberOfExaminees,
    batchName: item.batchId?.batch_name || 'Unknown Batch'
  }));
};

export const formatPieChartData = (highestScorers: PerformanceDetails['highestScorers']) => {
  return highestScorers.map((scorer, index) => ({
    name: scorer.studentId?.fullname || `Top ${index + 1}`,
    value: scorer.percentage,
    studentId: scorer.studentId?._id || null
  }));
};

export const generatePdfReport = (data: ExportRecordResponse, academicYear: string) => {
  const { records } = data;

  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    doc.setFont('helvetica', 'normal');
    const pageWidth = doc.internal.pageSize.getWidth();

    // Title Page
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(`Performance Report: ${academicYear}`, pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 15, 30);
    doc.text(`Total records: ${records.length}`, 15, 37);

    // Summary Statistics
    const avgPercentage = records.reduce((sum, record) => sum + record.overallPercentage, 0) / records.length;
    const totalExaminees = records.reduce((sum, record) => sum + record.numberOfExaminees, 0);
    const uniqueBatches = new Set(records.map(r => r.batchId?._id)).size;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('1. Key Statistics', 15, 50);

    doc.setFontSize(10);
    doc.text(`Average Performance: ${avgPercentage.toFixed(2)}%`, 20, 60);
    doc.text(`Total Examinees: ${totalExaminees}`, 20, 67);
    doc.text(`Unique Batches: ${uniqueBatches}`, 20, 74);

    // Batch Performance Table with names
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('2. Batch Performance', 15, 85);

    const batchTableData = records.map(record => [
      record.batchId?.batch_name || 'Unknown Batch',
      record.examId?.title || 'Unknown Exam',
      record.academicYear,
      `${record.overallPercentage.toFixed(2)}%`,
      record.numberOfExaminees.toString()
    ]);

    autoTable(doc, {
      startY: 90,
      head: [['Batch Name', 'Exam', 'Academic Year', 'Overall %', 'Examinees']],
      body: batchTableData,
      theme: 'grid',
      headStyles: {
        fillColor: [66, 135, 245],
        fontStyle: 'bold',
        textColor: 255
      },
      styles: {
        fontSize: 9,
        cellPadding: 2
      },
      margin: { left: 15 }
    });

    // Top Performers with names
    const currentY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('3. Top Performers', 15, currentY);

    let topPerformersData: string[][] = [];

    records.forEach(record => {
      record.highestScorers.forEach((scorer, index) => {
        topPerformersData.push([
          record.batchId?.batch_name || 'Unknown Batch',
          record.examId?.title || 'Unknown Exam',
          scorer.studentId?.fullname || `Student ${index + 1}`,
          `${scorer.percentage.toFixed(2)}%`,
          new Date(record.createdAt).toLocaleDateString()
        ]);
      });
    });

    autoTable(doc, {
      startY: currentY + 10,
      head: [['Batch', 'Exam', 'Student Name', 'Score', 'Date']],
      body: topPerformersData,
      theme: 'grid',
      headStyles: {
        fillColor: [66, 135, 245],
        fontStyle: 'bold',
        textColor: 255
      },
      styles: {
        fontSize: 8,
        cellPadding: 2,
        cellWidth: 'wrap'
      },
      margin: { left: 15 }
    });

    // Performance Trends
    const trendY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('4. Performance Trends', 15, trendY);

    const sortedRecords = [...records].sort((a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    if (sortedRecords.length > 1) {
      const firstRecord = sortedRecords[0];
      const lastRecord = sortedRecords[sortedRecords.length - 1];
      const performanceChange = lastRecord.overallPercentage - firstRecord.overallPercentage;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`First Exam: ${firstRecord.examId?.title || 'Unknown'} (${firstRecord.overallPercentage.toFixed(2)}%)`, 20, trendY + 10);
      doc.text(`Last Exam: ${lastRecord.examId?.title || 'Unknown'} (${lastRecord.overallPercentage.toFixed(2)}%)`, 20, trendY + 17);

      if (performanceChange > 0) {
        doc.setTextColor(0, 128, 0);
        doc.text(`▲ Improvement: +${performanceChange.toFixed(2)}%`, 20, trendY + 24);
      } else if (performanceChange < 0) {
        doc.setTextColor(255, 0, 0);
        doc.text(`▼ Decline: ${performanceChange.toFixed(2)}%`, 20, trendY + 24);
      } else {
        doc.setTextColor(0, 0, 0);
        doc.text('No significant change in performance', 20, trendY + 24);
      }
      doc.setTextColor(0, 0, 0);
    }

    // Footer - using the correct way to get page count
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(
        `Page ${i} of ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }

    doc.save(`performance_report_${academicYear.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
    return doc;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF report');
  }
};

export const exportToExcel = (data: any[], fileName: string) => {
  // Flatten nested objects for CSV export
  const flattenObject = (obj: any, prefix = ''): Record<string, any> => {
    return Object.keys(obj).reduce((acc, key) => {
      const value = obj[key];
      const newKey = prefix ? `${prefix}.${key}` : key;

      if (value && typeof value === 'object' && !Array.isArray(value)) {
        Object.assign(acc, flattenObject(value, newKey));
      } else {
        acc[newKey] = value;
      }
      return acc;
    }, {} as Record<string, any>);
  };

  const flattenedData = data.map(item => flattenObject(item));

  if (flattenedData.length === 0) {
    console.warn('No data to export');
    return;
  }

  const headers = Object.keys(flattenedData[0]);
  let csv = headers.join(',') + '\n';

  flattenedData.forEach(row => {
    const values = headers.map(header => {
      const value = row[header];
      if (value === undefined || value === null) return '';
      if (typeof value === 'object') return JSON.stringify(value);
      return String(value).replace(/"/g, '""');
    });
    csv += values.join(',') + '\n';
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${fileName.replace(/[^a-zA-Z0-9]/g, '_')}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};