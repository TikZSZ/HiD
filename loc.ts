import fs from 'fs';
import path from 'path';

interface FileStats
{
  name: string;
  lines: number;
  tokens: number;
}

async function initializeTokenizer ()
{
  const { Tiktoken } = await import( "tiktoken/lite" );
  const { load } = await import( "tiktoken/load" );
  const registry = await import( "tiktoken/registry.json" );
  const { default: models } = await import( "tiktoken/model_to_encoding.json" );

  //@ts-ignore 
  const model = await load( registry[ models[ "gpt-4o-mini" ] ] );
  return new Tiktoken(
    model.bpe_ranks,
    model.special_tokens,
    model.pat_str
  );
}

async function countLinesAndTokensInFile ( filePath: string, encoder: any ): Promise<{ lines: number; tokens: number }>
{
  const content = fs.readFileSync( filePath, 'utf-8' );
  const lines = content.split( '\n' ).length;
  const tokens = encoder.encode( content ).length;
  return { lines, tokens };
}

function getTypeScriptFiles ( dir: string ): string[]
{
  const files: string[] = [];
  const entries = fs.readdirSync( dir, { withFileTypes: true } );

  for ( const entry of entries )
  {
    const fullPath = path.join( dir, entry.name );
    if ( entry.isDirectory() )
    {
      files.push( ...getTypeScriptFiles( fullPath ) );
    } else if ( entry.isFile() && ( entry.name.endsWith( '.ts' ) || entry.name.endsWith( '.tsx' ) || entry.name.endsWith( '.css' ) ) )
    {
      files.push( fullPath );
    }
  }

  return files;
}

async function calculateLOCAndTokens ( projectPath: string, encoder: any ): Promise<{ total: { lines: number; tokens: number }; perFile: FileStats[] }>
{
  const files = getTypeScriptFiles( projectPath );
  let totalLines = 0;
  let totalTokens = 0;
  const fileStats: FileStats[] = [];

  for ( const file of files )
  {
    const { lines, tokens } = await countLinesAndTokensInFile( file, encoder );
    totalLines += lines;
    totalTokens += tokens;
    fileStats.push( {
      name: path.relative( projectPath, file ),
      lines: lines,
      tokens: tokens,
    } );
  }

  return { total: { lines: totalLines, tokens: totalTokens }, perFile: fileStats };
}

async function main ()
{
  const projectPath = './src'; // Adjust this to your project's source directory
  const encoder = await initializeTokenizer();
  const result = await calculateLOCAndTokens( projectPath, encoder );

  console.log( `Total lines of code: ${result.total.lines}` );
  console.log( `Total tokens: ${result.total.tokens}` );
  console.log( '\nLines and tokens per file:' );
  result.perFile.forEach( file =>
  {
    console.log( `${file.name}: ${file.lines} lines, ${file.tokens} tokens` );
  } );
}

main().catch( console.error );