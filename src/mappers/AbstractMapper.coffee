Types = require "../Types"
Format =  require "../utils/Format"

wordAsHex = Format.wordAsHex
Mirroring = Types.Mirroring

###########################################################
# Base class for ROM mappers
###########################################################

class NROMMapper

    constructor: (cartridge) ->
        @rom = cartridge.rom    # Also known as PRG ROM
        @vrom = cartridge.vrom  # Also known as CHR ROM
        @sram = cartridge.sram  # Also known as PRG RAM
        @vramEnabled = cartridge.hasVRAM
        @sramEnabled = cartridge.hasSRAM
        @setMirroring cartridge.mirroring
        @reset()

    ###########################################################
    # Power-up state initialization
    ###########################################################

    powerUp: ->
        @reset()

    reset: ->
        @resetROM()
        @resetVROM()
        @resetVRAM()

    resetROM: ->
        # For mappers to implement.

    resetVROM: ->
        # For mappers to implement.

    resetVRAM: ->
        @vram = (0 for [0...0x4000]) # Also known as CHR RAM (max. 16KB of VRAM, not all is used).

    ###########################################################
    # CPU reading / writing
    ###########################################################

    cpuRead: (address) ->
        if      address >= 0x8000 then @readROM address
        else if address >= 0x6000 then @readSRAM address
        else if address >= 0x4020 then @readEXRAM address
        else    throw "Illegal state (CPU is trying to read from 0x#{wordAsHex address} using MMC)."

    cpuWrite: (address, value) ->
        if      address >= 0x8000 then @writeROM address, value
        else if address >= 0x6000 then @writeSRAM address, value
        else if address >= 0x4020 then @writeEXRAM address, value
        else    throw "Illegal state (CPU is trying to write to 0x#{wordAsHex address} using MMC)."

    ###########################################################
    # ROM reading / writing
    ###########################################################

    readROM: (address) ->
        throw "Mapper does not implement ROM reading!"

    writeROM: (address, value) ->
         value # Read-only

    ###########################################################
    # SRAM reading / writing
    ###########################################################

    readSRAM: (address) ->
        if @sramEnabled
            @sram[@$getSRAMOffset address]
        else
            0

    writeSRAM: (address, value) ->
        if @sramEnabled
            @sram[@$getSRAMOffset address] = value
        else
            value

    getSRAMOffset: (address) ->
        address & 0x1FFF

    ###########################################################
    # Expansion RAM reading / writing
    ###########################################################

    readEXRAM: (address) ->
        0

    writeEXRAM: (address, value) ->
        value

    ###########################################################
    # PPU reading / writing
    ###########################################################

    ppuRead: (address) ->
        if      address >= 0x3F00 then @$readPallete address
        else if address >= 0x2000 then @$readNamesTable address
        else                           @$readPatternsTable address

    ppuWrite: (address, value) ->
        if      address >= 0x3F00 then @$writePallete address, value
        else if address >= 0x2000 then @$writeNamesTable address, value
        else                           @$writePatternsTable address, value

    ###########################################################
    # Pallete reading / writing
    ###########################################################

    readPallete: (address) ->
        @vram[@$getPalleteAddress address]

    writePallete: (address, value) ->
        @vram[@$getPalleteAddress address] = value

    getPalleteAddress: (address) ->
        if (address & 0x0003)
            address & 0x3F1F # Mirroring of [$3F00-$3F1F] in [$3F00-$3FFF]
        else
            address & 0x3F0F # $3F10/$3F14/$3F18/$3F1C are mirrorors of $3F00/$3F04/$3F08$/3F0C.

    ###########################################################
    # Names & attributes table reading / writing
    ###########################################################

    readNamesTable: (address) ->
        @vram[@$getNamesTableAddress address]

    writeNamesTable: (address, value) ->
        @vram[@$getNamesTableAddress address] = value

    getNamesTableAddress: (address) ->
        # Area [$2000-$2EFF] from [$2000-$2FFF] is mirrored in [$3000-$3EFF]
        (address & @mirroringMask1) | (address & @mirroringMask2) >> 1

    setMirroring: (mirroring) ->
        switch mirroring
            when Mirroring.SINGLE_SCREEN # [1|1|1|1] in [$2000-$2FFF]
                @mirroringMask1 = 0x23FF
                @mirroringMask2 = 0x0000
            when Mirroring.HORIZONTAL    # [1|1|2|2] in [$2000-$2FFF]
                @mirroringMask1 = 0x23FF
                @mirroringMask2 = 0x0800
            when Mirroring.VERTICAL      # [1|2|1|2] in [$2000-$2FFF]
                @mirroringMask1 = 0x27FF
                @mirroringMask2 = 0x0000
            when Mirroring.FOUR_SCREEN   # [1|2|3|4] in [$2000-$2FFF]
                @mirroringMask1 = 0x2FFF
                @mirroringMask2 = 0x0000

    ###########################################################
    # Patterns table reading / writing
    ###########################################################

    readPatternsTable: (address) ->
        if @vramEnabled
            @vram[address]
        else
            @readVROM address

    writePatternsTable: (address, value) ->
        if @vramEnabled
            @vram[address] = value
        else
            @writeVROM address, value

    ###########################################################
    # VROM reading / writing
    ###########################################################

    readVROM: (address) ->
        @vrom[address]

    writeVROM: (address, value) ->
         value # Read-only

module.exports = NROMMapper