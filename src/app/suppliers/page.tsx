import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UploadCloud, FileSpreadsheet } from "lucide-react";

export default function SuppliersPage() {
  return (
    <main className="p-4 md:p-6">
       <div className="flex flex-col items-center text-center">
        <h1 className="font-headline text-3xl md:text-4xl font-bold">Supplier Integration</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Enable suppliers to import data in bulk via spreadsheets and automatically assess supplier matching.
        </p>
      </div>

      <div className="mx-auto mt-8 grid max-w-4xl gap-8">
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Import Supplier Data</CardTitle>
                <CardDescription>Upload a CSV or Excel file to add or update supplier information.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col items-center justify-center space-y-4 rounded-lg border-2 border-dashed p-12 text-center">
                    <div className="rounded-full border bg-card p-4">
                        <UploadCloud className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground">Drag and drop your file here or click to browse</p>
                    <Button>
                        <FileSpreadsheet className="mr-2 h-4 w-4" />
                        Select Spreadsheet
                    </Button>
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Current Suppliers</CardTitle>
                <CardDescription>A list of suppliers currently in the database.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Supplier Name</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Match Rate</TableHead>
                            <TableHead>Date Added</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground">
                                No supplier data available. Upload a file to get started.
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      </div>
    </main>
  );
}
